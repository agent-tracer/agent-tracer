import { Inject, Injectable } from "@nestjs/common";
import type { KafkaConsumer, KafkaEachBatchPayload } from "@agent-tracer/platform";
import { CONSUMER_GROUP, TOPIC } from "@agent-tracer/kernel";
import { ApplyLedgerBatchUseCase } from "~tracer-api/domain/projection/application/apply.ledger.batch.usecase.js";
import { errorMessage, logError, logInfo } from "~tracer-api/support/log.js";
import { recordSkipped } from "~tracer-api/support/metrics.js";
import { parseLedgerRecord } from "~tracer-api/support/ledger.record.js";
import type { LedgerRecord } from "~tracer-api/support/ledger.record.js";
import { DB_EVENT_CONSUMER } from "~tracer-api/support/projector.tokens.js";

// 배치 최대 크기(100건)의 절반 주기로 하트비트를 보내 처리 중 리밸런스를 막는다.
const HEARTBEAT_EVERY_RECORDS = 25;

@Injectable()
export class DbConsumer {
    private resumeLogged = false;

    constructor(
        @Inject(DB_EVENT_CONSUMER) private readonly consumer: KafkaConsumer,
        private readonly applyLedgerBatch: ApplyLedgerBatchUseCase,
    ) {}

    async start(): Promise<void> {
        await this.consumer.connect();
        await this.consumer.subscribe({ topics: [TOPIC.ingestEvents] });
        logInfo({ msg: "kafka.consumer.started", groupId: CONSUMER_GROUP.projectorDb, topic: TOPIC.ingestEvents });
        await this.consumer.run({ eachBatchAutoResolve: true, eachBatch: (payload) => this.onBatch(payload) });
    }

    async stop(): Promise<void> {
        await this.consumer.disconnect();
    }

    private async onBatch(payload: KafkaEachBatchPayload): Promise<void> {
        const { batch } = payload;
        this.logResumeOnce(batch);
        let sinceHeartbeat = 0;
        try {
            await this.applyLedgerBatch.execute(this.decode(batch), async () => {
                sinceHeartbeat += 1;
                if (sinceHeartbeat < HEARTBEAT_EVERY_RECORDS) return;
                await payload.heartbeat();
                sinceHeartbeat = 0;
            });
        } catch (error) {
            logError({
                msg: "kafka.consumer.crashed",
                groupId: CONSUMER_GROUP.projectorDb,
                topic: batch.topic,
                partition: batch.partition,
                error: errorMessage(error),
            });
            throw error;
        }
    }

    // 재기동 뒤 첫 배치의 시작 seq를 한 번만 남겨 마지막 적용 지점에서 이어 소비했는지 확인시킨다.
    private logResumeOnce(batch: KafkaEachBatchPayload["batch"]): void {
        if (this.resumeLogged || batch.messages.length === 0) return;
        this.resumeLogged = true;
        const first = parseLedgerRecord(batch.messages[0]?.value ?? null);
        logInfo({
            msg: "kafka.consumer.resumed",
            groupId: CONSUMER_GROUP.projectorDb,
            topic: batch.topic,
            partition: batch.partition,
            seq: first?.seq ?? null,
        });
    }

    private *decode(batch: KafkaEachBatchPayload["batch"]): Iterable<LedgerRecord> {
        for (const message of batch.messages) {
            const record = parseLedgerRecord(message.value);
            if (record !== null) {
                yield record;
                continue;
            }
            logError({
                msg: "ledger.parse.skip",
                topic: batch.topic,
                partition: batch.partition,
                offset: message.offset,
            });
            recordSkipped("db");
        }
    }
}

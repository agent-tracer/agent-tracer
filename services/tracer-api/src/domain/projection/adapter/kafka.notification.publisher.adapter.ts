import { Inject, Injectable } from "@nestjs/common";
import { publishNotification, type KafkaProducer } from "@agent-tracer/platform";
import type { NotificationEnvelope } from "@agent-tracer/kernel";
import type { NotificationPublisherPort } from "~tracer-api/domain/projection/port/notification.publisher.port.js";
import { NOTIFICATION_PRODUCER } from "~tracer-api/support/projector.tokens.js";

/** 알림 봉투를 Kafka 알림 토픽으로 전송한다. */
@Injectable()
export class KafkaNotificationPublisher implements NotificationPublisherPort {
    constructor(@Inject(NOTIFICATION_PRODUCER) private readonly producer: KafkaProducer) {}

    publish(envelope: NotificationEnvelope): Promise<void> {
        return publishNotification(this.producer, envelope);
    }
}

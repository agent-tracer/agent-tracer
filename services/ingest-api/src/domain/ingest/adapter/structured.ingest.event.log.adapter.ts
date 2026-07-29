import { Injectable } from "@nestjs/common";
import type {
    AllRejectedIngestLog,
    AppendedIngestLog,
    AppendFailedIngestLog,
    BatchRejectedLog,
    ContractVersionRejectedLog,
    IngestEventLog,
    RateLimitedLog,
    RejectedIngestLog,
} from "~ingest-api/domain/ingest/port/ingest.event.log.port.js";
import { logError, logInfo, logWarn } from "~ingest-api/config/log.js";

/** 인제스트 결과를 구조화된 프로세스 로그로 출력한다. */
@Injectable()
export class StructuredIngestEventLogAdapter implements IngestEventLog {
    rejected(entry: RejectedIngestLog): void {
        logError({ msg: "ingest.event.rejected", ...entry });
    }

    appended(entry: AppendedIngestLog): void {
        logInfo({ msg: "ingest.batch.appended", ...entry });
    }

    appendFailed(entry: AppendFailedIngestLog): void {
        logError({ msg: "ingest.append.failed", ...entry });
    }

    allRejected(entry: AllRejectedIngestLog): void {
        logWarn({ msg: "ingest.batch.all_rejected", ...entry });
    }

    contractVersionRejected(entry: ContractVersionRejectedLog): void {
        logWarn({ msg: "ingest.contract_version.rejected", ...entry });
    }

    batchRejected(entry: BatchRejectedLog): void {
        logWarn({ msg: "ingest.batch.rejected", ...entry });
    }

    rateLimited(entry: RateLimitedLog): void {
        logWarn({ msg: "ingest.rate_limit.rejected", ...entry });
    }
}

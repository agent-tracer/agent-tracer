import type { NotificationEnvelope } from "@agent-tracer/kernel";

export const NOTIFICATION_PUBLISHER = Symbol("NotificationPublisher");

/** 배치 커밋 뒤 알림 봉투를 구독자에게 발행하는 포트다. */
export interface NotificationPublisherPort {
    publish(envelope: NotificationEnvelope): Promise<void>;
}

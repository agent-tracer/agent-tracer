import { Inject, Injectable } from "@nestjs/common";
import type { NotificationEnvelope } from "@agent-tracer/kernel";
import type { NotificationPublisherPort } from "~tracer-api/domain/projection/port/notification.publisher.port.js";
import { NotificationBroadcaster } from "~tracer-api/config/notification.broadcaster.js";

/** 투영과 조회 창구가 한 프로세스에 있는 로컬 프로파일에서 알림을 소켓 전파기로 바로 넘긴다. */
@Injectable()
export class InProcessNotificationPublisher implements NotificationPublisherPort {
    constructor(@Inject(NotificationBroadcaster) private readonly broadcaster: NotificationBroadcaster) {}

    publish(envelope: NotificationEnvelope): Promise<void> {
        this.broadcaster.fanout(envelope.userId, envelope.notification);
        return Promise.resolve();
    }
}

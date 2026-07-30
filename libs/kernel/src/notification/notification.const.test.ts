import { describe, expect, it } from "vitest";
import { TOPIC } from "../kafka/topic.const.js";
import { NOTIFICATION_TYPE, type NotificationEnvelope } from "./notification.const.js";

// 계약은 배포 단위가 아니라 submodule 이므로 별칭 표에 자리가 없고 로더를 파일 위치로 찾는다.
const contractModuleUrl = new URL(
    "../../../../contract/conformance/runner/contract.mjs",
    import.meta.url,
);
const { readJson } = (await import(contractModuleUrl.href)) as {
    readonly readJson: (relative: string) => unknown;
};

interface TopicDeclaration {
    readonly name: string;
    readonly key: string;
    readonly payload: Record<string, unknown>;
    readonly types?: { readonly jobUpdated: { readonly name: string } };
}

const topics = readJson("wire/topics.json") as Record<string, TopicDeclaration>;

describe("알림 토픽 계약", () => {
    it("알림 토픽의 이름은 계약이 선언한 이름과 같다", () => {
        expect(TOPIC.notifications).toBe(topics["notifications"]?.name);
    });

    it("알림 봉투의 칸은 계약이 선언한 칸과 같다", () => {
        const envelope: NotificationEnvelope = {
            userId: "user-1",
            notification: { type: NOTIFICATION_TYPE.jobUpdated, payload: {} },
        };

        expect(Object.keys(envelope).sort()).toEqual(
            Object.keys(topics["notifications"]?.payload ?? {}).sort(),
        );
    });

    it("알림을 나누는 키는 계약이 선언한 키와 같다", () => {
        expect(topics["notifications"]?.key).toBe("userId");
    });

    it("잡 갱신 알림의 종류는 계약이 선언한 이름과 같다", () => {
        expect(NOTIFICATION_TYPE.jobUpdated).toBe(topics["notifications"]?.types?.jobUpdated.name);
    });
});

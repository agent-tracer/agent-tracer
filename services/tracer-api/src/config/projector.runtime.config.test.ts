import { describe, expect, it } from "vitest";
import { loadProjectorRuntimeConfig } from "./projector.runtime.config.js";

describe("loadProjectorRuntimeConfig", () => {
    it("환경값이 없으면 projector 운영 기본값을 사용한다", () => {
        expect(loadProjectorRuntimeConfig({})).toEqual({
            searchOutboxDrainIntervalMs: 5_000,
            eventsOtlp: undefined,
        });
    });

    it("양의 정수 환경값으로 운영 주기를 덮어쓴다", () => {
        expect(loadProjectorRuntimeConfig({
            PROJECTOR_SEARCH_OUTBOX_DRAIN_INTERVAL_MS: "7",
        })).toMatchObject({
            searchOutboxDrainIntervalMs: 7,
        });
    });

    it("유효하지 않은 운영 주기는 기본값으로 닫는다", () => {
        const config = loadProjectorRuntimeConfig({
            PROJECTOR_SEARCH_OUTBOX_DRAIN_INTERVAL_MS: "not-a-number",
        });

        expect(config.searchOutboxDrainIntervalMs).toBe(5_000);
    });

    it("이벤트 OTLP 대상만 공백과 마지막 슬래시를 정규화한다", () => {
        expect(loadProjectorRuntimeConfig({
            EVENTS_OTLP_ENDPOINT: " https://collector.example/v1/events/ ",
            OTEL_EXPORTER_OTLP_ENDPOINT: "https://telemetry.example",
        }).eventsOtlp).toEqual({ endpoint: "https://collector.example/v1/events" });
        expect(loadProjectorRuntimeConfig({ EVENTS_OTLP_ENDPOINT: "   " }).eventsOtlp).toBeUndefined();
    });
});

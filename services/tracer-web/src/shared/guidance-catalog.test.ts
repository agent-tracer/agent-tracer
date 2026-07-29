import type { ReactNode } from "react";
import { describe, expect, expectTypeOf, it } from "vitest";
import {
  EN_GUIDANCE,
  GUIDANCE_BUNDLES,
  KO_GUIDANCE,
  createGuidanceMessage,
  isGuidanceMessage,
  selectGuidanceBundle,
} from "~tracer-web/shared/guidance.js";

describe("guidance catalog", () => {
  it("영어와 한국어 카탈로그의 키와 leaf 종류를 동일하게 유지한다", () => {
    expect(catalogShape(KO_GUIDANCE)).toEqual(catalogShape(EN_GUIDANCE));
    expect(
      isGuidanceMessage(EN_GUIDANCE.common.runCommandToContinue("npm test")),
    ).toBe(true);
    expect(
      isGuidanceMessage(KO_GUIDANCE.common.runCommandToContinue("npm test")),
    ).toBe(true);
  });

  it("알 수 없는 locale은 고정된 영어 bundle로 되돌린다", () => {
    expect(selectGuidanceBundle(undefined)).toBe(GUIDANCE_BUNDLES.en);
    expect(selectGuidanceBundle("fr")).toBe(GUIDANCE_BUNDLES.en);
    expect(selectGuidanceBundle("ko")).toBe(GUIDANCE_BUNDLES.ko);
    expect(selectGuidanceBundle("ko")).toBe(selectGuidanceBundle("ko"));
  });

  it("bundle과 모든 catalog namespace를 동결한다", () => {
    expect(Object.isFrozen(GUIDANCE_BUNDLES)).toBe(true);
    expect(Object.isFrozen(GUIDANCE_BUNDLES.en)).toBe(true);
    expect(Object.isFrozen(EN_GUIDANCE)).toBe(true);
    expect(Object.isFrozen(EN_GUIDANCE.common)).toBe(true);
    expect(Object.isFrozen(EN_GUIDANCE.common.guidanceUnavailable)).toBe(true);
  });

  it("message 본문을 opaque 객체로 유지하고 ReactNode로 노출하지 않는다", () => {
    const message = EN_GUIDANCE.common.guidanceUnavailable;

    expect(isGuidanceMessage(message)).toBe(true);
    expect(Object.keys(message)).toEqual([]);
    expect(JSON.stringify(message)).toBe("{}");
    expectTypeOf(message).not.toMatchTypeOf<ReactNode>();
  });

  it("비어 있거나 구조화되지 않은 message 입력을 거부한다", () => {
    expect(() => createGuidanceMessage()).toThrow(TypeError);
    expect(() =>
      createGuidanceMessage({ kind: "html", value: "<b>unsafe</b>" } as never),
    ).toThrow(TypeError);
  });
});

function catalogShape(value: unknown, path = ""): string[] {
  if (isGuidanceMessage(value)) {
    return [`${path}:message`];
  }
  if (typeof value === "function") {
    return [`${path}:factory`];
  }
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new TypeError(`Invalid catalog value at ${path}`);
  }

  return Object.entries(value)
    .flatMap(([key, child]) =>
      catalogShape(child, path.length === 0 ? key : `${path}.${key}`),
    )
    .sort();
}

import type { ApiRequestError } from "~tracer-web/shared/api/client/response.js";
import type { GuidanceCatalog, GuidanceMessage } from "~tracer-web/shared/guidance.js";

type CommonMessages = GuidanceCatalog["common"];
type ApiErrorKey = keyof CommonMessages["apiError"];

/** 상태에서 온 코드와 도메인이 선언한 코드가 함께 오는 자리다. */
const BY_CODE: Readonly<Record<string, ApiErrorKey>> = {
  unauthorized: "unauthorized",
  forbidden: "forbidden",
  not_found: "notFound",
  conflict: "conflict",
  bad_request: "badRequest",
  unprocessable_entity: "validation",
  validation_error: "validation",
  rate_limited: "rateLimited",
  internal_server_error: "serverError",
  request_failed: "unknown",
};

const BY_STATUS: Readonly<Record<number, ApiErrorKey>> = {
  401: "unauthorized",
  403: "forbidden",
  404: "notFound",
  409: "conflict",
  400: "badRequest",
  422: "validation",
  429: "rateLimited",
  501: "notImplemented",
};

/** 서버 문구 대신 코드와 상태가 가리키는 화면의 말을 고른다. */
export function apiErrorMessage(messages: CommonMessages, error: unknown): GuidanceMessage {
  const requestError = error instanceof Error ? (error as ApiRequestError) : undefined;
  const byCode = requestError?.code === undefined ? undefined : BY_CODE[requestError.code];
  if (byCode !== undefined) return messages.apiError[byCode];

  const status = requestError?.status;
  if (status !== undefined) {
    const byStatus = BY_STATUS[status];
    if (byStatus !== undefined) return messages.apiError[byStatus];
    if (status >= 500) return messages.apiError.serverError;
    return messages.apiError.unknown;
  }

  // status가 없다는 것은 응답을 받지 못했다는 뜻이다.
  if (requestError !== undefined) return messages.apiError.unreachable;
  return messages.apiError.unknown;
}

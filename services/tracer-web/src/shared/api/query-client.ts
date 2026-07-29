// web 앱이 쓰는 TanStack Query 클라이언트의 팩토리와, 호스트와 연합 리모트가 함께 쓰는 단일 인스턴스.

import { QueryClient } from "@tanstack/react-query";

const DEFAULT_STALE_TIME_MS = 30_000;

export function createMonitorQueryClient(): QueryClient {
    return new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: DEFAULT_STALE_TIME_MS,
                refetchOnWindowFocus: true,
                retry: 1
            },
            mutations: {
                retry: 0
            }
        }
    });
}

/** 호스트가 소유하는 유일한 인스턴스이며 연합 리모트는 `./api`로 이것을 받는다. */
export const monitorQueryClient: QueryClient = createMonitorQueryClient();

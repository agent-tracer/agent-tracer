import { useEffect } from "react";
import type { TimelineEventRecord } from "~tracer-web/entities/task/model/timeline/event.js";
import { laneThemeForEvent } from "~tracer-web/entities/task/model/lane-theme.js";
import {
  ALL_VISIBLE_LANES,
  type VisibleLane,
} from "~tracer-web/shared/store/slices/viewSlice.js";
import {
  useSelectedEventId,
  useToggleVisibleLane,
  useVisibleLanes,
} from "~tracer-web/shared/store/index.js";

/** 레인 필터가 다루는 레인인지 확인해, 배경처럼 끌 수 없는 레인을 켜려 들지 않게 한다. */
function toVisibleLane(key: string): VisibleLane | null {
  const found = ALL_VISIBLE_LANES.find((lane) => lane === key);
  return found ?? null;
}

/**
 * 트레이스처럼 레인 필터를 거치지 않는 자리에서 고른 이벤트가 숨은 레인에 있으면
 * 피드와 그래프가 아무 반응도 못 하므로 그 레인을 다시 보인다.
 */
export function useRevealSelectedLane(events: readonly TimelineEventRecord[]): void {
  const selectedEventId = useSelectedEventId();
  const visibleLanes = useVisibleLanes();
  const toggleVisibleLane = useToggleVisibleLane();

  useEffect(() => {
    if (selectedEventId === null) return;
    const selected = events.find((event) => event.id === selectedEventId);
    if (selected === undefined) return;
    const lane = toVisibleLane(laneThemeForEvent(selected).key);
    if (lane === null || visibleLanes.includes(lane)) return;
    toggleVisibleLane(lane);
  }, [selectedEventId, events, visibleLanes, toggleVisibleLane]);
}

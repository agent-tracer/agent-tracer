import { useEffect } from "react";
import type { TimelineEventRecord } from "~tracer-web/entities/task/model/timeline/event.js";
import { laneThemeForEvent } from "~tracer-web/entities/task/model/lane-theme.js";
import type { VisibleLane } from "~tracer-web/shared/store/slices/viewSlice.js";
import {
  useSelectedEventId,
  useToggleVisibleLane,
  useVisibleLanes,
} from "~tracer-web/shared/store/index.js";

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
    const lane = laneThemeForEvent(selected).key as VisibleLane;
    if (visibleLanes.includes(lane)) return;
    toggleVisibleLane(lane);
  }, [selectedEventId, events, visibleLanes, toggleVisibleLane]);
}

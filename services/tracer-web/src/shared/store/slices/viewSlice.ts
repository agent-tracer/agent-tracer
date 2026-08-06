export type MainView = "feed" | "graph";
export type InspectorTab = "inspect" | "rules" | "trace";

/** 사용자가 화면에 유지하기로 고른 시각 레인. */
export type VisibleLane =
  | "user"
  | "asst"
  | "plan"
  | "expl"
  | "impl"
  | "rule"
  | "veri"
  | "coord";

export const ALL_VISIBLE_LANES: readonly VisibleLane[] = [
  "user",
  "asst",
  "plan",
  "expl",
  "impl",
  "rule",
  "veri",
  "coord",
];

/** `ALL_VISIBLE_LANES`와 짝을 이루는, 레인을 모두 숨긴 상태다. */
export const NO_VISIBLE_LANES: readonly VisibleLane[] = [];

export interface ViewSlice {
  readonly mainView: MainView;
  readonly inspectorTab: InspectorTab;
  readonly visibleLanes: readonly VisibleLane[];
  readonly setMainView: (view: MainView) => void;
  readonly setInspectorTab: (tab: InspectorTab) => void;
  readonly toggleVisibleLane: (lane: VisibleLane) => void;
  readonly setVisibleLanes: (lanes: readonly VisibleLane[]) => void;
}

type SetState = (
  partial: Partial<ViewSlice> | ((state: ViewSlice) => Partial<ViewSlice>),
) => void;

export function createViewSlice(set: SetState): ViewSlice {
  return {
    mainView: "feed",
    inspectorTab: "inspect",
    visibleLanes: ALL_VISIBLE_LANES,
    setMainView: (mainView) => set({ mainView }),
    setInspectorTab: (inspectorTab) => set({ inspectorTab }),
    setVisibleLanes: (visibleLanes) => set({ visibleLanes }),
    toggleVisibleLane: (lane) =>
      set((state) => {
        // 켤 수 없는 레인에 내용만 같은 새 배열을 돌려주면 그 참조 변화를 보고
        // 다시 부르는 구독자가 무한히 돈다.
        if (!ALL_VISIBLE_LANES.includes(lane)) return {};
        const has = state.visibleLanes.includes(lane);
        if (has) {
          // 모두 숨긴 상태는 All로 되돌릴 수 있으므로 마지막 레인도 끈다.
          return {
            visibleLanes: state.visibleLanes.filter((l) => l !== lane),
          };
        }
        // 정해진 순서대로 다시 삽입해, 사용자가 토글할 때 칩 목록의
        // 순서가 예측 불가능하게 바뀌지 않게 한다.
        const next = ALL_VISIBLE_LANES.filter(
          (l) => state.visibleLanes.includes(l) || l === lane,
        );
        return { visibleLanes: next };
      }),
  };
}

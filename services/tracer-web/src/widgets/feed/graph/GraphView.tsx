import type { TaskTurnSummary } from "~tracer-web/entities/task/model/task-query.js";
import type { TurnSplitSelection } from "~tracer-web/features/turn-split/index.js";
import type { TimelineEventRecord } from "~tracer-web/entities/task/model/timeline/event.js";
import type { TaskVerification } from "~tracer-web/entities/task/model/timeline/verification.js";
import { GraphContextStrip } from "~tracer-web/widgets/feed/graph/context/GraphContextStrip.js";
import { GraphControls } from "~tracer-web/widgets/feed/graph/controls/GraphControls.js";
import { GraphLegend } from "~tracer-web/widgets/feed/graph/controls/GraphLegend.js";
import { useGraphScene } from "~tracer-web/widgets/feed/graph/model/use-graph-scene.js";
import { GraphAxis } from "~tracer-web/widgets/feed/graph/plot/GraphAxis.js";
import { GraphPlot } from "~tracer-web/widgets/feed/graph/plot/GraphPlot.js";
import {
  LANE_LABEL_WIDTH,
  TRACK_LEFT_PADDING,
} from "~tracer-web/widgets/feed/graph/model/track-geometry.js";
import { GraphViewport } from "~tracer-web/widgets/feed/graph/viewport/GraphViewport.js";
import { useGraphViewport } from "~tracer-web/widgets/feed/graph/viewport/use-graph-viewport.js";

interface GraphViewProps {
  readonly events: readonly TimelineEventRecord[];
  readonly verifications: readonly TaskVerification[];
  readonly turns?: readonly TaskTurnSummary[];
  readonly taskStatus?: "running" | "waiting" | "completed" | "errored";
  readonly splitSelection?: TurnSplitSelection;
}

/** 그래프 scene, viewport, plot, context와 controls를 조립한다. */
export function GraphView({
  events,
  verifications,
  turns = [],
  taskStatus,
  splitSelection,
}: GraphViewProps) {
  const scene = useGraphScene({
    events,
    verifications,
    turns,
    ...(taskStatus ? { taskStatus } : {}),
  });
  const viewport = useGraphViewport({
    itemCount: events.length,
    latestLeftPercent: scene.latestLeftPercent,
    selectedKey: scene.selectedKey,
    selectedLeftPercent: scene.selectedLeftPercent,
  });

  return (
    <div className="px-gutter pb-6">
      <div className="rounded-md bg-s1 border border-hair overflow-hidden">
        <GraphViewport binding={viewport.binding}>
          <GraphPlot
            events={events}
            range={scene.range}
            lanes={scene.lanes}
            nodes={scene.nodes}
            edges={scene.edges}
            nowMs={scene.nowMs}
            turns={turns}
            {...(splitSelection ? { splitSelection } : {})}
          />
          <GraphContextStrip events={events} range={scene.range} />
          <GraphAxis
            ticks={scene.ticks}
            leftOffset={LANE_LABEL_WIDTH + TRACK_LEFT_PADDING}
          />
        </GraphViewport>
        <GraphLegend />
        <GraphControls
          zoom={viewport.binding.zoom}
          onZoom={viewport.setZoom}
          hideEmptyLanes={scene.hideEmptyLanes}
          onToggleEmptyLanes={scene.toggleEmptyLanes}
          hiddenEmptyCount={scene.hiddenEmptyCount}
        />
      </div>
    </div>
  );
}

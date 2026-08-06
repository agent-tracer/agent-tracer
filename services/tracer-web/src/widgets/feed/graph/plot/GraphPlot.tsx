import type { TimelineEventRecord } from "~tracer-web/entities/task/model/timeline/event.js";
import type { TaskTurnSummary } from "~tracer-web/entities/task/model/task-query.js";
import type { TurnSplitSelection } from "~tracer-web/features/turn-split/index.js";
import type { LaneKey } from "~tracer-web/entities/task/model/lane-theme.js";
import type { TimeRange } from "~tracer-web/widgets/feed/graph/model/time-range.js";
import type { FeedEdge } from "~tracer-web/widgets/feed/graph/model/edges.js";
import type { PositionedNode } from "~tracer-web/widgets/feed/graph/model/node-layout.js";
import {
  LANE_HEIGHT,
  TURN_STRIP_HEIGHT,
} from "~tracer-web/widgets/feed/graph/model/track-geometry.js";
import { CompactBand } from "~tracer-web/widgets/feed/graph/plot/CompactBand.js";
import { GraphEdges } from "~tracer-web/widgets/feed/graph/plot/GraphEdges.js";
import { GraphLanes } from "~tracer-web/widgets/feed/graph/plot/GraphLanes.js";
import { GraphNode } from "~tracer-web/widgets/feed/graph/plot/GraphNode.js";
import { NowMarker } from "~tracer-web/widgets/feed/graph/plot/NowMarker.js";
import { TurnBands } from "~tracer-web/widgets/feed/graph/plot/TurnBands.js";

interface GraphPlotProps {
  readonly events: readonly TimelineEventRecord[];
  readonly range: TimeRange;
  readonly lanes: readonly LaneKey[];
  readonly nodes: readonly PositionedNode[];
  readonly edges: readonly FeedEdge[];
  readonly nowMs: number;
  readonly turns: readonly TaskTurnSummary[];
  readonly splitSelection?: TurnSplitSelection;
}

/** 레인·노드·엣지·시간 마커를 하나의 plot 좌표계에 그린다. */
export function GraphPlot({
  events,
  range,
  lanes,
  nodes,
  edges,
  nowMs,
  turns,
  splitSelection,
}: GraphPlotProps) {
  return (
    <div
      className="relative"
      style={{ height: lanes.length * LANE_HEIGHT + TURN_STRIP_HEIGHT }}
    >
      {/* 레인 좌표계는 띠 아래에서 시작하므로 노드와 엣지의 계산은 그대로 둔다. */}
      <div
        className="absolute inset-x-0 bottom-0"
        style={{ top: TURN_STRIP_HEIGHT }}
      >
        <GraphLanes lanes={lanes} />
        <CompactBand events={events} range={range} />
        <GraphEdges
          edges={edges}
          nodes={nodes}
          visibleLaneCount={lanes.length}
        />
        {nodes.map((node) => (
          <GraphNode key={node.id} node={node} />
        ))}
      </div>
      <TurnBands
        turns={turns}
        range={range}
        {...(splitSelection ? { splitSelection } : {})}
      />
      <NowMarker nowMs={nowMs} range={range} />
    </div>
  );
}

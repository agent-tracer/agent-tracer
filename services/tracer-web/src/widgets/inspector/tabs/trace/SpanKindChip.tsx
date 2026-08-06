import type { OpenInferenceSpanKind } from "~tracer-web/entities/task/model/openinference.js";
import type { GuidanceCatalog } from "~tracer-web/shared/guidance.js";
import { useGuidance } from "~tracer-web/shared/store/index.js";
import { Chip, GuidanceText, Tooltip, type ChipTone } from "~tracer-web/shared/ui/index.js";

interface SpanKindChipProps {
  readonly kind: OpenInferenceSpanKind;
}

/** 피드에서 보던 색이 트레이스에서도 같은 뜻을 갖도록 레인 색을 빌린다. */
const KIND: Readonly<
  Record<OpenInferenceSpanKind, { tone: ChipTone; label: string; guidanceKey: SpanKindDescription }>
> = {
  LLM: { tone: "plan", label: "LLM", guidanceKey: "llm" },
  TOOL: { tone: "impl", label: "TOOL", guidanceKey: "tool" },
  AGENT: { tone: "coord", label: "AGENT", guidanceKey: "agent" },
  RETRIEVER: { tone: "expl", label: "FETCH", guidanceKey: "retriever" },
  CHAIN: { tone: "neutral", label: "STEP", guidanceKey: "chain" },
  UNKNOWN: { tone: "quiet", label: "MISC", guidanceKey: "unknown" },
};

export function SpanKindChip({ kind }: SpanKindChipProps) {
  const guidance = useGuidance();
  const entry = KIND[kind];
  return (
    <Tooltip
      content={
        <GuidanceText
          locale={guidance.locale}
          message={guidance.messages.inspector.spanKinds[entry.guidanceKey]}
        />
      }
      side="right"
    >
      <Chip tone={entry.tone}>{entry.label}</Chip>
    </Tooltip>
  );
}

type SpanKindDescription = keyof GuidanceCatalog["inspector"]["spanKinds"];

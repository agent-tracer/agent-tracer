import type { VerdictStatus } from "~tracer-web/entities/rule/model/rule.js";
import { Chip, type ChipTone } from "~tracer-web/shared/ui/index.js";
import type { EvidenceTone } from "~tracer-web/widgets/rules/evidence/evidence-tone.js";

const VERDICT_LABEL: Record<VerdictStatus, string> = {
  satisfied: "FULFILLED",
  unmet: "NOT FULFILLED",
  open: "NOT YET",
  unknown: "CANNOT VERIFY",
};

/** 판정이 열린 적 없는 규칙이며 이행 여부를 아직 말할 수 없다. */
const NOT_EVALUATED = "NOT EVALUATED";

export function verdictTone(status: VerdictStatus | null): EvidenceTone {
  if (status === "satisfied") return "action";
  if (status === null) return "trigger";
  return "warn";
}

export function verdictLabel(status: VerdictStatus | null): string {
  return status === null ? NOT_EVALUATED : VERDICT_LABEL[status];
}

function verdictChipTone(status: VerdictStatus | null): ChipTone {
  if (status === null) return "quiet";
  return status === "satisfied" ? "neutral" : "warn";
}

/** 규칙이 이행됐는지를 한 줄로 답하며 접힌 카드와 증거 패널이 같은 것을 쓴다. */
export function RuleVerdictChip({ status }: { readonly status: VerdictStatus | null }) {
  return <Chip tone={verdictChipTone(status)}>{verdictLabel(status)}</Chip>;
}

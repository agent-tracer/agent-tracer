import type { RuleSeverity } from "~tracer-web/entities/rule/model/rule.js";
import { Chip, type ChipTone } from "~tracer-web/shared/ui/index.js";

interface RuleSeverityChipProps {
  readonly severity: RuleSeverity;
}

const TONE: Readonly<Record<RuleSeverity, ChipTone>> = {
  info: "neutral",
  warn: "warn",
  block: "err",
};

export function RuleSeverityChip({ severity }: RuleSeverityChipProps) {
  return <Chip tone={TONE[severity]}>{severity}</Chip>;
}

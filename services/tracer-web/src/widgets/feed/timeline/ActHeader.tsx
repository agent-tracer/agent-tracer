import type { ActVm } from "~tracer-web/widgets/feed/lib/timeline/act-classification.js";
import { Chip } from "~tracer-web/shared/ui/index.js";

interface ActHeaderProps {
  readonly vm: ActVm;
}

/** act 카드의 상단 행. */
export function ActHeader({ vm }: ActHeaderProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Chip tone={vm.lane.chipTone}>{vm.lane.label}</Chip>
      <span className="font-mono text-meta text-ink font-medium tracking-snug">
        {vm.toolName}
      </span>
      {vm.hasViolation && (
        <Chip tone="err" className="ml-auto">
          viol
        </Chip>
      )}
    </div>
  );
}

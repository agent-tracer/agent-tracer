import { useState } from "react";
import type { TaskId } from "~tracer-web/shared/identity.js";
import type { TaskTurnSummary } from "~tracer-web/entities/task/model/task-query.js";
import { useSplitTaskTurnsMutation } from "~tracer-web/entities/task/api/split-mutations.js";
import type { TurnSplitTarget } from "~tracer-web/features/turn-split/model/turn-split-target.js";
import {
  defaultSplitTitle,
  splitSpanLabel,
  turnsInSpan,
} from "~tracer-web/features/turn-split/model/split-preview.js";
import { apiErrorMessage } from "~tracer-web/shared/api/api-error-message.js";
import {
  Button,
  Field,
  GuidanceText,
  Input,
  Modal,
  SectionLabel,
} from "~tracer-web/shared/ui/index.js";
import { guidancePlainText } from "~tracer-web/shared/guidance-message.js";
import { useGuidance } from "~tracer-web/shared/store/index.js";

/** 고른 구간이 있을 때만 세우므로 제목 초안은 세워질 때 한 번만 짓는다. */
interface TurnSplitModalProps {
  readonly taskId: TaskId;
  readonly target: TurnSplitTarget;
  readonly turns: readonly TaskTurnSummary[];
  readonly onClose: () => void;
}

/** 무엇이 옮겨지고 무엇이 따라가지 않는지 보인 뒤에 구간을 떼어낸다. */
export function TurnSplitModal({ taskId, target, turns, onClose }: TurnSplitModalProps) {
  const guidance = useGuidance();
  const mutation = useSplitTaskTurnsMutation(taskId);
  // 타임라인이 다시 읽힐 때마다 초안을 다시 지으면 사용자가 적던 제목이 지워진다.
  const [title, setTitle] = useState(() => defaultSplitTitle(turns, target));

  const moved = turnsInSpan(turns, target);
  const submit = () => {
    mutation.mutate(
      {
        sessionId: target.sessionId,
        fromTurnIndex: target.fromTurnIndex,
        toTurnIndex: target.toTurnIndex,
        newTitle: title.trim(),
      },
      { onSuccess: onClose },
    );
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={guidancePlainText(guidance.messages.feed.splitModalTitle(splitSpanLabel(target)))}
      description={guidance.messages.feed.splitNoRules}
      descriptionLocale={guidance.locale}
      maxWidth={460}
    >
      <div className="px-4 pb-4">
        <Field
          label="New task title"
          help={guidance.messages.feed.splitReversible}
          helpLocale={guidance.locale}
        >
          <Input
            autoFocus
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && title.trim() !== "") submit();
            }}
          />
        </Field>

        <div className="pt-4 border-t border-hair">
          <SectionLabel>Turns that move</SectionLabel>
          <ul className="mt-1.5 flex flex-col gap-1">
            {moved.map((turn) => (
              <li key={turn.id} className="flex items-baseline gap-2 min-w-0">
                <span className="w-4 shrink-0 text-right font-mono text-mini text-ink-tertiary">
                  {turn.turnIndex}
                </span>
                <span className="truncate text-meta text-ink leading-normal">
                  {turn.askedText ?? "—"}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {mutation.isError && (
          <GuidanceText
            as="p"
            className="mt-3 mb-0 text-body text-err"
            locale={guidance.locale}
            message={apiErrorMessage(guidance.messages.common, mutation.error)}
          />
        )}

        <footer className="mt-4 flex justify-end gap-2 pt-3 border-t border-hair">
          <Button onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={title.trim() === "" || mutation.isPending}
            onClick={submit}
          >
            {mutation.isPending ? "Splitting…" : "Split turns"}
          </Button>
        </footer>
      </div>
    </Modal>
  );
}

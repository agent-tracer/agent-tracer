import { useEffect, useState } from "react";
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
import { Button, GuidanceText, Input, Modal } from "~tracer-web/shared/ui/index.js";
import { guidancePlainText } from "~tracer-web/shared/guidance-message.js";
import { useGuidance } from "~tracer-web/shared/store/index.js";

interface TurnSplitModalProps {
  readonly taskId: TaskId;
  readonly target: TurnSplitTarget | null;
  readonly turns: readonly TaskTurnSummary[];
  readonly onClose: () => void;
}

/** 무엇이 옮겨지고 무엇이 따라가지 않는지 보인 뒤에 구간을 떼어낸다. */
export function TurnSplitModal({ taskId, target, turns, onClose }: TurnSplitModalProps) {
  const guidance = useGuidance();
  const mutation = useSplitTaskTurnsMutation(taskId);
  const [title, setTitle] = useState("");

  useEffect(() => {
    if (target !== null) setTitle(defaultSplitTitle(turns, target));
  }, [target, turns]);

  if (target === null) return null;

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
      maxWidth={480}
    >
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-tertiary">
            <GuidanceText locale={guidance.locale} message={guidance.messages.feed.splitTitleLabel} />
          </span>
          <Input
            autoFocus
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>

        <div className="flex flex-col gap-1.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-tertiary">
            <GuidanceText locale={guidance.locale} message={guidance.messages.feed.splitMovingLabel} />
          </span>
          <ul className="flex flex-col rounded-xs border border-hair bg-s1 divide-y divide-hair">
            {moved.map((turn) => (
              <li key={turn.id} className="flex items-baseline gap-2.5 px-2.5 py-1.5">
                <span className="shrink-0 font-mono text-[10.5px] text-ink-tertiary">
                  {turn.turnIndex}
                </span>
                <span className="truncate text-[12.5px] text-ink">
                  {turn.askedText ?? "—"}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {mutation.isError ? (
          <p className="text-[12px] text-err">
            <GuidanceText
              locale={guidance.locale}
              message={apiErrorMessage(guidance.messages.common, mutation.error)}
            />
          </p>
        ) : null}

        <div className="flex items-center justify-between gap-3">
          <span className="text-[11.5px] text-ink-tertiary">
            <GuidanceText locale={guidance.locale} message={guidance.messages.feed.splitReversible} />
          </span>
          <span className="flex shrink-0 gap-2">
            <Button onClick={onClose}>Cancel</Button>
            <Button
              variant="primary"
              disabled={title.trim() === "" || mutation.isPending}
              onClick={submit}
            >
              Split
            </Button>
          </span>
        </div>
      </div>
    </Modal>
  );
}

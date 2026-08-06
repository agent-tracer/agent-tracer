import { useEffect, useState } from "react";
import type { TaskId } from "~tracer-web/shared/identity.js";
import type { TaskTurnSummary } from "~tracer-web/entities/task/model/task-query.js";
import { useSplitTaskTurnsMutation } from "~tracer-web/entities/task/api/split-mutations.js";
import { apiErrorMessage } from "~tracer-web/shared/api/api-error-message.js";
import { Button, GuidanceText, Input, Modal } from "~tracer-web/shared/ui/index.js";
import { useGuidance } from "~tracer-web/shared/store/index.js";

export interface TurnSplitTarget {
  readonly sessionId: string;
  readonly fromTurnIndex: number;
  readonly toTurnIndex: number;
}

interface TurnSplitModalProps {
  readonly taskId: TaskId;
  readonly target: TurnSplitTarget | null;
  readonly turns: readonly TaskTurnSummary[];
  readonly onClose: () => void;
}

function defaultTitle(turns: readonly TaskTurnSummary[], target: TurnSplitTarget): string {
  const first = turns.find((turn) => turn.turnIndex === target.fromTurnIndex);
  return first ? `Turn ${first.turnIndex + 1}` : "Split task";
}

/** 고른 구간을 새 태스크로 떼기 전에 무엇이 옮겨지고 무엇이 따라가지 않는지 보인다. */
export function TurnSplitModal({ taskId, target, turns, onClose }: TurnSplitModalProps) {
  const guidance = useGuidance();
  const mutation = useSplitTaskTurnsMutation(taskId);
  const [title, setTitle] = useState("");

  useEffect(() => {
    if (target !== null) setTitle(defaultTitle(turns, target));
  }, [target, turns]);

  if (target === null) return null;

  const span =
    target.fromTurnIndex === target.toTurnIndex
      ? `Turn ${target.fromTurnIndex + 1}`
      : `Turns ${target.fromTurnIndex + 1}–${target.toTurnIndex + 1}`;

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
    <Modal open onClose={onClose} title={`${span} → new task`}>
      <div className="flex flex-col gap-3">
        <Input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="New task title"
        />
        <p className="text-[12px] text-ink-muted">
          <GuidanceText locale={guidance.locale} message={guidance.messages.feed.splitNoRules} />
        </p>
        {mutation.isError ? (
          <p className="text-[12px] text-err">
            <GuidanceText
              locale={guidance.locale}
              message={apiErrorMessage(guidance.messages.common, mutation.error)}
            />
          </p>
        ) : null}
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            disabled={title.trim() === "" || mutation.isPending}
            onClick={submit}
          >
            Split
          </Button>
        </div>
      </div>
    </Modal>
  );
}

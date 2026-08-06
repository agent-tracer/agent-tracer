import { useEffect, useMemo, useState } from "react";
import type { MonitoringTask } from "~tracer-web/entities/task/model/task.js";
import type { TaskId } from "~tracer-web/shared/identity.js";
import { useTaskUserInputsQuery } from "~tracer-web/entities/task/api/detail-queries.js";
import { useRequestRuleGenerationMutation } from "~tracer-web/entities/rule/api/rule-generation-queries.js";
import { apiErrorMessage } from "~tracer-web/shared/api/api-error-message.js";
import type { GuidanceMessage } from "~tracer-web/shared/guidance.js";
import { useGuidance } from "~tracer-web/shared/store/index.js";
import { Button, Field, GuidanceText, Input, Select } from "~tracer-web/shared/ui/index.js";
import { resolveAnchorEventId } from "~tracer-web/widgets/rules/anchor-event.js";

const ANCHOR_PREVIEW_MAX = 90;

function preview(text: string): string {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > ANCHOR_PREVIEW_MAX ? `${flat.slice(0, ANCHOR_PREVIEW_MAX)}…` : flat;
}

/** 태스크와 그 안의 발화를 골라 규칙 생성을 건다. */
export function RuleGenerationDialog({
  tasks,
  onClose,
}: {
  readonly tasks: readonly MonitoringTask[];
  readonly onClose: () => void;
}) {
  const guidance = useGuidance();
  const [taskId, setTaskId] = useState<TaskId | "">("");
  const [anchorEventId, setAnchorEventId] = useState("");
  const [intent, setIntent] = useState("");
  const [errorMessage, setErrorMessage] = useState<GuidanceMessage | null>(null);
  const request = useRequestRuleGenerationMutation();

  const inputsQuery = useTaskUserInputsQuery(taskId === "" ? null : taskId);
  const inputs = useMemo(() => inputsQuery.data ?? [], [inputsQuery.data]);

  useEffect(() => {
    setAnchorEventId((current) => resolveAnchorEventId(current, inputs));
  }, [inputs]);

  const disabled = taskId === "" || anchorEventId === "" || request.isPending;

  async function submit() {
    if (taskId === "") return;
    setErrorMessage(null);
    try {
      await request.mutateAsync({
        taskId,
        anchorEventId,
        ...(intent.trim().length > 0 ? { intent: intent.trim() } : {}),
      });
      onClose();
    } catch (error) {
      setErrorMessage(apiErrorMessage(guidance.messages.common, error));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Field label="Task">
        <Select value={taskId} onChange={(e) => setTaskId(e.target.value as TaskId)}>
          <option value="">Select a task</option>
          {tasks.map((task) => (
            <option key={task.id} value={task.id}>
              {task.title.length > 0 ? task.title : task.id}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Anchor input">
        <Select
          value={anchorEventId}
          disabled={inputs.length === 0}
          onChange={(e) => setAnchorEventId(e.target.value)}
        >
          {inputs.length === 0 && <option value="">No user input</option>}
          {inputs.map((input) => (
            <option key={input.eventId} value={input.eventId}>
              {preview(input.text)}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Intent (optional)">
        <Input
          value={intent}
          placeholder="e.g. check that tests were written first"
          onChange={(e) => setIntent(e.target.value)}
        />
      </Field>

      {errorMessage !== null && (
        <GuidanceText
          as="p"
          className="m-0 text-body text-err"
          locale={guidance.locale}
          message={errorMessage}
        />
      )}

      <div className="flex items-center gap-2 justify-end">
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
        <Button disabled={disabled} onClick={() => void submit()}>
          {request.isPending ? "Starting…" : "Generate rules"}
        </Button>
      </div>
    </div>
  );
}

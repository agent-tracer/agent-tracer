import { useEffect, useMemo, useState } from "react";
import type { MonitoringTask } from "~tracer-web/entities/task/model/task.js";
import type { TaskId } from "~tracer-web/shared/identity.js";
import { useTaskUserInputsQuery } from "~tracer-web/entities/task/api/detail-queries.js";
import { useRequestRuleGenerationMutation } from "~tracer-web/entities/rule/api/rule-generation-queries.js";
import { Button, Field, Input, Select } from "~tracer-web/shared/ui/index.js";

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
  const [taskId, setTaskId] = useState<TaskId | "">("");
  const [anchorEventId, setAnchorEventId] = useState("");
  const [intent, setIntent] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const request = useRequestRuleGenerationMutation();

  const inputsQuery = useTaskUserInputsQuery(taskId === "" ? null : taskId);
  const inputs = useMemo(() => inputsQuery.data ?? [], [inputsQuery.data]);

  useEffect(() => {
    setAnchorEventId(inputs.at(-1)?.eventId ?? "");
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
      setErrorMessage((error as Error).message);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Field label="태스크">
        <Select value={taskId} onChange={(e) => setTaskId(e.target.value as TaskId)}>
          <option value="">태스크를 고르세요</option>
          {tasks.map((task) => (
            <option key={task.id} value={task.id}>
              {task.title.length > 0 ? task.title : task.id}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="앵커 발화">
        <Select
          value={anchorEventId}
          disabled={inputs.length === 0}
          onChange={(e) => setAnchorEventId(e.target.value)}
        >
          {inputs.length === 0 && <option value="">발화가 없습니다</option>}
          {inputs.map((input) => (
            <option key={input.eventId} value={input.eventId}>
              {preview(input.text)}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="의도 (선택)">
        <Input
          value={intent}
          placeholder="예: 테스트를 먼저 썼는지 본다"
          onChange={(e) => setIntent(e.target.value)}
        />
      </Field>

      {errorMessage !== null && <p className="m-0 text-[12px] text-err">{errorMessage}</p>}

      <div className="flex items-center gap-2 justify-end">
        <Button variant="ghost" onClick={onClose}>
          닫기
        </Button>
        <Button disabled={disabled} onClick={() => void submit()}>
          {request.isPending ? "거는 중…" : "규칙 생성"}
        </Button>
      </div>
    </div>
  );
}

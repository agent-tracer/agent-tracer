import { useState } from "react";
import type { MonitoringTask } from "~tracer-web/entities/task/model/task.js";
import type { TaskId } from "~tracer-web/shared/identity.js";
import { useGuidance } from "~tracer-web/shared/store/index.js";
import { Field, GuidanceText, InlineState, Select } from "~tracer-web/shared/ui/index.js";
import { RuleForm } from "~tracer-web/widgets/rules/editor/RuleForm.js";

/** 규칙은 태스크의 이벤트를 검사하므로 어느 태스크를 볼지부터 고르고 폼을 연다. */
export function NewRuleDialog({
  tasks,
  onClose,
}: {
  readonly tasks: readonly MonitoringTask[];
  readonly onClose: () => void;
}) {
  const guidance = useGuidance();
  const [taskId, setTaskId] = useState<TaskId | "">("");

  return (
    <div className="flex flex-col">
      <div className="px-4 pt-4">
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
      </div>

      {taskId === "" ? (
        <InlineState state="empty">
          <GuidanceText
            locale={guidance.locale}
            message={guidance.messages.rules.newTaskDescription}
          />
        </InlineState>
      ) : (
        <RuleForm key={taskId} taskId={taskId} onClose={onClose} />
      )}
    </div>
  );
}

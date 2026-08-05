import { useMemo, useState } from "react";
import type { MonitoringTask } from "~tracer-web/entities/task/model/task.js";
import type { TaskId } from "~tracer-web/shared/identity.js";
import type { RuleRecord } from "~tracer-web/entities/rule/model/rule.js";
import { useRulesQuery } from "~tracer-web/entities/rule/api/queries.js";
import { useTasksQuery } from "~tracer-web/entities/task/api/list-queries.js";
import { useGuidance } from "~tracer-web/shared/store/index.js";
import { Button, GuidanceText, Modal } from "~tracer-web/shared/ui/index.js";
import { useRuleGenerationsQuery } from "~tracer-web/entities/rule/api/rule-generation-queries.js";
import { RuleForm } from "~tracer-web/widgets/rules/editor/RuleForm.js";
import { RuleGenerationDialog } from "~tracer-web/widgets/rules/generation/RuleGenerationDialog.js";
import { RuleGenerationStrip } from "~tracer-web/widgets/rules/generation/RuleGenerationStrip.js";
import { RuleFilterBar, type SeverityFilter, type SourceFilter } from "~tracer-web/widgets/rules/RuleFilterBar.js";
import { RuleListItem } from "~tracer-web/widgets/rules/RuleListItem.js";

/** `/rules`. 워크스페이스 전체 규칙 관리 화면이다. */
export function RulesPage() {
  const guidance = useGuidance();
  const { data, isLoading, isError } = useRulesQuery();
  const tasksQ = useTasksQuery();
  const taskById = useMemo(() => {
    const m = new Map<TaskId, MonitoringTask>();
    for (const t of tasksQ.data?.tasks ?? []) m.set(t.id, t);
    return m;
  }, [tasksQ.data]);
  const [severity, setSeverity] = useState<SeverityFilter>("all");
  const [search, setSearch] = useState("");
  const [source, setSource] = useState<SourceFilter>("all");
  const [editingRule, setEditingRule] = useState<RuleRecord | null>(null);
  const [creating, setCreating] = useState<"none" | "generate" | "manual">("none");
  const generations = useRuleGenerationsQuery();

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    return data.rules.filter((rule) => {
      if (severity !== "all" && rule.severity !== severity) return false;
      if (source !== "all" && rule.source !== source) return false;
      if (q && !rule.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [data, severity, search, source]);

  return (
    <div className="flex flex-col min-h-0 h-full overflow-auto">
      <header className="px-9 pt-6 pb-4 flex flex-col gap-3 border-b border-hair">
        <div>
          <p className="m-0 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-tertiary">
            Workspace
          </p>
          <div className="flex items-start gap-3">
            <h1 className="mt-0.5 mb-0 text-[22px] font-semibold text-ink tracking-[-0.3px]">
              Rules
            </h1>
            <span className="ml-auto flex items-center gap-2">
              <Button variant="ghost" onClick={() => setCreating("manual")}>
                New rule
              </Button>
              <Button onClick={() => setCreating("generate")}>Generate rules</Button>
            </span>
          </div>
          <GuidanceText
            as="p"
            className="mt-1 mb-0 text-[12.5px] text-ink-subtle"
            locale={guidance.locale}
            message={guidance.messages.rules.workspaceIntroduction}
          />
          <p className="mt-1 mb-0 text-[12.5px] text-ink-subtle">
            {isLoading
              ? "Loading…"
              : data
                ? `${data.rules.length} rule${data.rules.length === 1 ? "" : "s"} configured`
                : "Couldn't load rules."}
          </p>
        </div>

        <RuleFilterBar
          severity={severity}
          onSeverityChange={setSeverity}
          search={search}
          onSearchChange={setSearch}
          source={source}
          onSourceChange={setSource}
        />
      </header>

      <div className="px-9 py-6 flex flex-col gap-2.5">
        {(generations.data ?? []).slice(0, 3).map((record) => (
          <RuleGenerationStrip key={record.id} record={record} />
        ))}
        {isError && (
          <div className="text-err text-[12.5px]">
            <p className="m-0">Couldn't load rules.</p>
            <GuidanceText
              as="p"
              className="mt-1 mb-0"
              locale={guidance.locale}
              message={guidance.messages.rules.loadError}
            />
          </div>
        )}
        {!isLoading && filtered.length === 0 && (
          data && data.rules.length === 0 ? (
            <GuidanceText
              as="p"
              className="text-[12.5px] text-ink-subtle text-center py-8"
              locale={guidance.locale}
              message={guidance.messages.rules.workspaceEmpty}
            />
          ) : (
            <p className="text-[12.5px] text-ink-subtle text-center py-8">
              No rules match the current filters.
            </p>
          )
        )}
        {filtered.map((rule) => (
          <RuleListItem
            key={rule.id}
            rule={rule}
            onEdit={setEditingRule}
            task={taskById.get(rule.taskId) ?? null}
          />
        ))}
      </div>

      <Modal
        open={creating !== "none"}
        onClose={() => setCreating("none")}
        title={creating === "generate" ? "Generate rules" : "New rule"}
        description={guidance.messages.rules.editDescription}
        descriptionLocale={guidance.locale}
      >
        {creating === "generate" && (
          <RuleGenerationDialog
            tasks={tasksQ.data?.tasks ?? []}
            onClose={() => setCreating("none")}
          />
        )}
      </Modal>

      <Modal
        open={editingRule !== null}
        onClose={() => setEditingRule(null)}
        title="Edit rule"
        description={guidance.messages.rules.editDescription}
        descriptionLocale={guidance.locale}
      >
        {editingRule && (
          <RuleForm
            rule={editingRule}
            taskId={editingRule.taskId}
            onClose={() => setEditingRule(null)}
          />
        )}
      </Modal>
    </div>
  );
}

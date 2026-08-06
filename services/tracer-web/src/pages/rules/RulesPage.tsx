import { useMemo, useState } from "react";
import type { MonitoringTask } from "~tracer-web/entities/task/model/task.js";
import type { TaskId } from "~tracer-web/shared/identity.js";
import type { RuleRecord } from "~tracer-web/entities/rule/model/rule.js";
import { useRulesQuery } from "~tracer-web/entities/rule/api/queries.js";
import { useTasksQuery } from "~tracer-web/entities/task/api/list-queries.js";
import { useGuidance } from "~tracer-web/shared/store/index.js";
import {
  Button,
  GuidanceText,
  InlineState,
  Modal,
  PageHeader,
  loadFailedLabel,
  loadingLabel,
} from "~tracer-web/shared/ui/index.js";
import { useRuleGenerationsQuery } from "~tracer-web/entities/rule/api/rule-generation-queries.js";
import { NewRuleDialog } from "~tracer-web/widgets/rules/editor/NewRuleDialog.js";
import { RuleForm } from "~tracer-web/widgets/rules/editor/RuleForm.js";
import { RuleGenerationDialog } from "~tracer-web/widgets/rules/generation/RuleGenerationDialog.js";
import { RuleGenerationHistory } from "~tracer-web/widgets/rules/generation/RuleGenerationHistory.js";
import { RuleFilterBar, type SeverityFilter, type SourceFilter } from "~tracer-web/widgets/rules/RuleFilterBar.js";
import { RuleListItem } from "~tracer-web/widgets/rules/RuleListItem.js";
import { RuleSectionTabs, type RuleSectionTab } from "~tracer-web/widgets/rules/RuleSectionTabs.js";

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
  const [tab, setTab] = useState<RuleSectionTab>("rules");
  const generations = useRuleGenerationsQuery();
  const records = generations.data ?? [];
  const running = records.filter((r) => r.status === "pending" || r.status === "running").length;

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
      <PageHeader
        eyebrow="Workspace"
        title="Rules"
        intro={guidance.messages.rules.workspaceIntroduction}
        introLocale={guidance.locale}
        {...(tab === "rules"
          ? {
              status: isLoading
                ? loadingLabel("rules")
                : data
                  ? `${data.rules.length} rule${data.rules.length === 1 ? "" : "s"} configured`
                  : loadFailedLabel("rules"),
            }
          : {})}
        actions={
          <>
            <Button variant="ghost" onClick={() => setCreating("manual")}>
              New rule
            </Button>
            <Button variant="primary" onClick={() => setCreating("generate")}>
              Generate rules
            </Button>
          </>
        }
      />

      <RuleSectionTabs
        active={tab}
        onSelect={setTab}
        counts={{ rules: data?.rules.length ?? 0, generations: records.length }}
        runningGenerations={running}
      />

      {tab === "generations" ? (
        <div className="px-gutter py-6 flex flex-col gap-2.5">
          <RuleGenerationHistory records={records} isLoading={generations.isLoading} />
        </div>
      ) : (
        <div className="px-gutter py-6 flex flex-col gap-2.5">
          <RuleFilterBar
            severity={severity}
            onSeverityChange={setSeverity}
            search={search}
            onSearchChange={setSearch}
            source={source}
            onSourceChange={setSource}
          />
          {isError && (
            <div className="text-err text-body">
              <p className="m-0">{loadFailedLabel("rules")}</p>
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
              <InlineState state="empty">
                <GuidanceText
                  locale={guidance.locale}
                  message={guidance.messages.rules.workspaceEmpty}
                />
              </InlineState>
            ) : (
              <InlineState state="empty">
                No rules match the current filters.
              </InlineState>
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
      )}

      <Modal
        open={creating !== "none"}
        onClose={() => setCreating("none")}
        title={creating === "generate" ? "Generate rules" : "New rule"}
        description={
          creating === "generate"
            ? guidance.messages.rules.generation.introduction
            : guidance.messages.rules.newWorkspaceDescription
        }
        descriptionLocale={guidance.locale}
      >
        {creating === "generate" ? (
          <RuleGenerationDialog
            tasks={tasksQ.data?.tasks ?? []}
            onClose={() => setCreating("none")}
          />
        ) : creating === "manual" ? (
          <NewRuleDialog
            tasks={tasksQ.data?.tasks ?? []}
            onClose={() => setCreating("none")}
          />
        ) : null}
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

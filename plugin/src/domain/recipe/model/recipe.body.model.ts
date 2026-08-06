import type {
    CachedRecipe,
    CachedRecipeRecovery,
    CachedRecipeStep,
    CachedRecipeVerify,
} from "~plugin/domain/recipe/model/recipe.model.js";

/** 레시피 하나를 전문 텍스트로 조립하며, 에이전트가 명시적으로 요청했을 때만 오므로 절단하지 않는다. */
export function buildRecipeBody(recipe: CachedRecipe): string {
    const lines = [`# ${recipe.title}`, "", `intent: ${recipe.intent}`, recipe.description];

    pushBullets(lines, "## When to use", recipe.useWhen);
    pushBullets(lines, "## Before you start", recipe.inputs);

    const summary = recipe.summaryMd.trim();
    if (summary) lines.push("", summary);

    pushWorkflow(lines, recipe);

    if (recipe.pitfalls.length > 0) {
        lines.push("", "## Pitfalls");
        for (const pitfall of recipe.pitfalls) lines.push(`- ${pitfall.pitfall} — ${pitfall.whyNonObvious}`);
    }

    if (recipe.corrections.length > 0) {
        lines.push("", "## Corrections");
        for (const correction of recipe.corrections) {
            lines.push(`- ${correction.whatAgentDid} → ${correction.howCorrected}`);
        }
    }

    // 단계에 매이지 않은 복구는 걸 자리가 없으므로 Corrections 뒤에 모은다.
    const looseRecovery = recipe.recovery.filter((entry) => entry.stepOrder === undefined);
    if (looseRecovery.length > 0) {
        lines.push("", "## Recovery");
        for (const entry of looseRecovery) lines.push(`- ${recoveryText(entry)}`);
    }

    pushBullets(lines, "## When you are done", recipe.outputs);

    if (recipe.touchedFiles.length > 0) {
        lines.push("", "## References");
        for (const file of recipe.touchedFiles) {
            const notes = [file.why, file.loadWhen ? `read when ${file.loadWhen}` : ""].filter(Boolean).join("; ");
            lines.push(`- ${file.path} (${file.role})${notes ? ` — ${notes}` : ""}`);
        }
    }

    if (recipe.governingRules.length > 0) lines.push("", `governing rules: ${recipe.governingRules.join(", ")}`);
    return lines.join("\n");
}

function pushBullets(lines: string[], heading: string, entries: readonly string[]): void {
    if (entries.length === 0) return;
    lines.push("", heading);
    for (const entry of entries) lines.push(`- ${entry}`);
}

function pushWorkflow(lines: string[], recipe: CachedRecipe): void {
    if (recipe.steps.length === 0) return;
    lines.push("", "## Workflow");
    for (const step of [...recipe.steps].sort((left, right) => left.order - right.order)) {
        const rationale = step.rationale ? ` (${step.rationale})` : "";
        lines.push(`${step.order}. ${step.action}${rationale}`);
        pushStepDetail(lines, step, recipe.recovery);
    }
}

function pushStepDetail(lines: string[], step: CachedRecipeStep, recovery: readonly CachedRecipeRecovery[]): void {
    if (step.verify !== undefined) lines.push(`   - verify: ${verifyText(step.verify)}`);
    for (const entry of recovery) {
        if (entry.stepOrder === step.order) lines.push(`   - recovery: ${recoveryText(entry)}`);
    }
}

function verifyText(verify: CachedRecipeVerify): string {
    if (verify.kind === "command") return `run a command matching ${verify.commandMatches.join(", ")}`;
    if (verify.kind === "pattern") return `output matches ${verify.pattern}`;
    return `observed as ${verify.tool}`;
}

function recoveryText(entry: CachedRecipeRecovery): string {
    return `${entry.symptom} → ${entry.action}`;
}

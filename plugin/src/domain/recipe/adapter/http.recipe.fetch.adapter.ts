import {getJson, type Fetched} from "~plugin/config/http.js";
import type {
    CachedRecipe,
    CachedRecipeCorrection,
    CachedRecipePitfall,
    CachedRecipeRecovery,
    CachedRecipeStep,
    CachedRecipeTouchedFile,
    CachedRecipeVerify,
} from "~plugin/domain/recipe/model/recipe.model.js";
import type {RecipeFetchPort} from "~plugin/domain/recipe/port/recipe.fetch.port.js";
import {isRecord} from "~plugin/support/json.js";

const REQUEST_TIMEOUT_MS = 5000;

/** 레시피 하나를 캐시 없이 서버에서 매 호출 직접 가져온다. */
export class HttpRecipeFetchAdapter implements RecipeFetchPort {
    constructor(
        private readonly baseUrl: string,
        private readonly headers: Record<string, string>,
    ) {}

    async fetch(recipeId: string): Promise<Fetched<CachedRecipe>> {
        const fetched = await getJson<Record<string, unknown>>(
            `${this.baseUrl}/api/v1/recipes/${encodeURIComponent(recipeId)}`,
            this.headers,
            REQUEST_TIMEOUT_MS,
        );
        if (fetched.kind !== "found") return fetched;
        const recipe = toCachedRecipe(unwrapRecipe(fetched.value));
        return recipe === null ? {kind: "unavailable"} : {kind: "found", value: recipe};
    }
}

/** 조회 창구는 레시피를 통계·적용 이력과 함께 봉투에 담으므로 레시피 자리를 지목해 꺼낸다. */
function unwrapRecipe(value: Record<string, unknown>): unknown {
    const payload = "data" in value ? value["data"] : value;
    if (isRecord(payload) && isRecord(payload["recipe"])) return payload["recipe"];
    return payload;
}

function toCachedRecipe(value: unknown): CachedRecipe | null {
    if (!isRecord(value)) return null;
    const id = readString(value, "id");
    const title = readString(value, "title");
    if (!id || !title) return null;
    return {
        id,
        title,
        intent: readString(value, "intent"),
        description: readString(value, "description"),
        useWhen: readStringArray(value["useWhen"]),
        summaryMd: readString(value, "summaryMd"),
        inputs: readStringArray(value["inputs"]),
        outputs: readStringArray(value["outputs"]),
        steps: readSteps(value["steps"]),
        pitfalls: readPitfalls(value["pitfalls"]),
        corrections: readCorrections(value["corrections"]),
        recovery: readRecovery(value["recovery"]),
        touchedFiles: readTouchedFiles(value["touchedFiles"]),
        governingRules: readStringArray(value["governingRules"]),
    };
}

function readSteps(value: unknown): CachedRecipeStep[] {
    if (!Array.isArray(value)) return [];
    const steps: CachedRecipeStep[] = [];
    for (const entry of value) {
        if (!isRecord(entry)) continue;
        const order = entry["order"];
        const action = readString(entry, "action");
        if (typeof order !== "number" || !action) continue;
        const rationale = readString(entry, "rationale");
        const verify = readVerify(entry["verify"]);
        steps.push({order, action, ...(rationale ? {rationale} : {}), ...(verify ? {verify} : {})});
    }
    return steps;
}

/** 세 갈래 가운데 어느 것도 온전하지 않으면 단계를 버리지 않고 확인 신호만 뺀다. */
function readVerify(value: unknown): CachedRecipeVerify | null {
    if (!isRecord(value)) return null;
    const kind = value["kind"];
    if (kind === "command") {
        const commandMatches = readStringArray(value["commandMatches"]);
        return commandMatches.length > 0 ? {kind, commandMatches} : null;
    }
    if (kind === "pattern") {
        const pattern = readString(value, "pattern");
        return pattern ? {kind, pattern} : null;
    }
    if (kind === "action") {
        const tool = value["tool"];
        const known = tool === "command" || tool === "file-read" || tool === "file-write" || tool === "web";
        return known ? {kind, tool} : null;
    }
    return null;
}

function readRecovery(value: unknown): CachedRecipeRecovery[] {
    if (!Array.isArray(value)) return [];
    const recovery: CachedRecipeRecovery[] = [];
    for (const entry of value) {
        if (!isRecord(entry)) continue;
        const symptom = readString(entry, "symptom");
        const action = readString(entry, "action");
        if (!symptom || !action) continue;
        const stepOrder = entry["stepOrder"];
        recovery.push({symptom, action, ...(typeof stepOrder === "number" ? {stepOrder} : {})});
    }
    return recovery;
}

function readPitfalls(value: unknown): CachedRecipePitfall[] {
    if (!Array.isArray(value)) return [];
    const pitfalls: CachedRecipePitfall[] = [];
    for (const entry of value) {
        if (!isRecord(entry)) continue;
        const pitfall = readString(entry, "pitfall");
        const whyNonObvious = readString(entry, "whyNonObvious");
        if (pitfall && whyNonObvious) pitfalls.push({pitfall, whyNonObvious});
    }
    return pitfalls;
}

function readCorrections(value: unknown): CachedRecipeCorrection[] {
    if (!Array.isArray(value)) return [];
    const corrections: CachedRecipeCorrection[] = [];
    for (const entry of value) {
        if (!isRecord(entry)) continue;
        const whatAgentDid = readString(entry, "whatAgentDid");
        const howCorrected = readString(entry, "howCorrected");
        if (whatAgentDid && howCorrected) corrections.push({whatAgentDid, howCorrected});
    }
    return corrections;
}

function readTouchedFiles(value: unknown): CachedRecipeTouchedFile[] {
    if (!Array.isArray(value)) return [];
    const files: CachedRecipeTouchedFile[] = [];
    for (const entry of value) {
        if (!isRecord(entry)) continue;
        const path = readString(entry, "path");
        const role = entry["role"];
        if (!path || (role !== "read" && role !== "write" && role !== "both")) continue;
        const why = readString(entry, "why");
        const loadWhen = readString(entry, "loadWhen");
        files.push({path, role, ...(why ? {why} : {}), ...(loadWhen ? {loadWhen} : {})});
    }
    return files;
}

function readStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value.filter((entry): entry is string => typeof entry === "string");
}

function readString(source: Record<string, unknown>, key: string): string {
    const value = source[key];
    return typeof value === "string" ? value : "";
}

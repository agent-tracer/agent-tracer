import { SectionLabel } from "~tracer-web/shared/ui/index.js";
import type {
  RecipeCorrection,
  RecipePitfall,
  RecipeRecovery,
} from "~tracer-web/entities/recipe/model/recipe.js";

/** 근거를 요구받는 항목들이며, 승인 화면은 문장과 그 문장을 뒷받침한 이벤트를 나란히 보인다. */
export function Evidence({ ids }: { readonly ids: readonly string[] }) {
  return (
    <div className="mt-0.5 flex flex-wrap gap-1 text-mini font-mono text-ink-tertiary">
      {ids.map((id) => (
        <span key={id} className="py-px px-1.5 rounded-pill bg-s1">
          {id}
        </span>
      ))}
    </div>
  );
}

export function Corrections({ rows }: { readonly rows: readonly RecipeCorrection[] }) {
  return (
    <div className="mt-2.5">
      <SectionLabel>Corrections</SectionLabel>
      <div className="mt-1 flex flex-col gap-1.5 text-meta text-ink">
        {rows.map((row, i) => (
          <div key={`${row.whatAgentDid}-${i}`} className="leading-normal">
            <div>
              <span className="text-ink-muted">Did:</span> {row.whatAgentDid}
            </div>
            <div>
              <span className="text-ink-muted">Corrected:</span> {row.howCorrected}
            </div>
            {row.evidence.length > 0 && <Evidence ids={row.evidence} />}
          </div>
        ))}
      </div>
    </div>
  );
}

export function Pitfalls({ rows }: { readonly rows: readonly RecipePitfall[] }) {
  return (
    <div className="mt-2.5">
      <SectionLabel>Pitfalls</SectionLabel>
      <div className="mt-1 flex flex-col gap-1.5 text-meta text-ink">
        {rows.map((row, i) => (
          <div key={`${row.pitfall}-${i}`} className="leading-normal">
            <div>{row.pitfall}</div>
            <div className="text-ink-muted">{row.whyNonObvious}</div>
            {row.evidence.length > 0 && <Evidence ids={row.evidence} />}
          </div>
        ))}
      </div>
    </div>
  );
}

export function Recovery({ rows }: { readonly rows: readonly RecipeRecovery[] }) {
  return (
    <div className="mt-2.5">
      <SectionLabel>Recovery</SectionLabel>
      <div className="mt-1 flex flex-col gap-1.5 text-meta text-ink">
        {rows.map((row, i) => (
          <div key={`${row.symptom}-${i}`} className="leading-normal">
            <div>
              <span className="text-ink-muted">Symptom:</span> {row.symptom}
              {typeof row.stepOrder === "number" && (
                <span className="text-ink-tertiary text-mini font-mono"> · step {row.stepOrder}</span>
              )}
            </div>
            <div>
              <span className="text-ink-muted">Action:</span> {row.action}
            </div>
            {row.evidence.length > 0 && <Evidence ids={row.evidence} />}
          </div>
        ))}
      </div>
    </div>
  );
}

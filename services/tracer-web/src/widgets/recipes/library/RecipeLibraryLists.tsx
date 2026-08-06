import { useState } from "react";
import type { Recipe } from "~tracer-web/entities/recipe/model/recipe.js";
import {
  Button,
  GuidanceText,
  InlineState,
  Input,
  Modal,
  Textarea,
} from "~tracer-web/shared/ui/index.js";
import {
  useDeleteRecipeMutation,
  useEditRecipeMutation,
  useRetireRecipeMutation,
} from "~tracer-web/entities/recipe/api/mutations.js";
import { apiErrorMessage } from "~tracer-web/shared/api/api-error-message.js";
import type { GuidanceMessage } from "~tracer-web/shared/guidance.js";
import { useGuidance } from "~tracer-web/shared/store/index.js";
import { RecipeCard } from "~tracer-web/widgets/recipes/presentation/RecipeCard.js";
import { canDeleteRecipe } from "~tracer-web/widgets/recipes/library/recipe-status.js";

interface ListProps {
  readonly rows: readonly Recipe[];
  readonly loading: boolean;
  readonly taskTitleById: ReadonlyMap<string, string>;
}

/** 승인된 레시피를 수정·보관하는 라이브러리를 표시한다. */
export function ActiveRecipesList({ rows, loading, taskTitleById }: ListProps) {
  const guidance = useGuidance();
  if (loading) return <InlineState state="loading" subject="recipes" />;
  if (rows.length === 0) {
    return (
      <InlineState state="empty">
        <GuidanceText
          locale={guidance.locale}
          message={guidance.messages.recipes.activeEmpty}
        />
      </InlineState>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      {rows.map((r) => (
        <ActiveRecipeCard key={r.id} recipe={r} taskTitleById={taskTitleById} />
      ))}
    </div>
  );
}

export function ArchivedRecipesList({ rows, loading, taskTitleById }: ListProps) {
  const guidance = useGuidance();
  if (loading) return <InlineState state="loading" subject="the archive" />;
  if (rows.length === 0) {
    return (
      <InlineState state="empty">
        <GuidanceText
          locale={guidance.locale}
          message={guidance.messages.recipes.archiveEmpty}
        />
      </InlineState>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      {rows.map((r) => (
        <ActiveRecipeCard key={r.id} recipe={r} taskTitleById={taskTitleById} muted />
      ))}
    </div>
  );
}

function ActiveRecipeCard({
  recipe,
  taskTitleById,
  muted = false,
}: {
  readonly recipe: Recipe;
  readonly taskTitleById: ReadonlyMap<string, string>;
  readonly muted?: boolean;
}) {
  const guidance = useGuidance();
  const retire = useRetireRecipeMutation();
  const edit = useEditRecipeMutation();
  const remove = useDeleteRecipeMutation();
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [form, setForm] = useState(() => ({
    title: recipe.title,
    intent: recipe.intent,
    description: recipe.description,
    summaryMd: recipe.summaryMd,
  }));
  const [error, setError] = useState<GuidanceMessage | null>(null);

  // 닫으면서 되돌리면 저장 직후의 낡은 값이 남아 다시 열었을 때 바뀌기 전 글이 보이므로 열 때 지금 값을 싣는다.
  function openEditor() {
    setError(null);
    setForm({
      title: recipe.title,
      intent: recipe.intent,
      description: recipe.description,
      summaryMd: recipe.summaryMd,
    });
    setEditing(true);
  }

  function closeEditor() {
    setEditing(false);
    setError(null);
  }

  function saveEdit() {
    setError(null);
    edit.mutate(
      {
        recipeId: recipe.id,
        body: {
          title: form.title.trim(),
          intent: form.intent.trim(),
          description: form.description.trim(),
          summaryMd: form.summaryMd.trim(),
        },
      },
      {
        onSuccess: () => closeEditor(),
        onError: (err) => setError(apiErrorMessage(guidance.messages.common, err)),
      },
    );
  }

  return (
    <>
      <RecipeCard
        recipe={recipe}
        taskTitleById={taskTitleById}
        footMetaAt={recipe.updatedAt}
        muted={muted}
        metaPills={
          <div className="mt-1.5 flex flex-wrap gap-1.5 text-mini font-mono text-ink-tertiary">
            <Pill>rev {recipe.rev}</Pill>
            <Pill>{recipe.status}</Pill>
            <Pill>{recipe.userEdited ? "provenance user" : "provenance agent"}</Pill>
            <Pill>applied {recipe.applicationCount}</Pill>
          </div>
        }
        actions={
          recipe.status === "active" ? (
            <>
              <Button variant="ghost" disabled={edit.isPending} onClick={openEditor}>
                Edit
              </Button>
              <Button variant="ghost" disabled={retire.isPending} onClick={() => retire.mutate(recipe.id)}>
                Retire
              </Button>
            </>
          ) : canDeleteRecipe(recipe) ? (
            <Button variant="ghost" disabled={remove.isPending} onClick={() => setConfirmingDelete(true)}>
              Delete
            </Button>
          ) : undefined
        }
      />
      <Modal
        open={confirmingDelete}
        onClose={() => setConfirmingDelete(false)}
        title="Delete recipe"
        description={guidance.messages.recipes.deleteDescription}
        descriptionLocale={guidance.locale}
      >
        <div className="p-4 flex flex-col gap-3">
          <div className="text-lead text-ink">{recipe.title}</div>
          {remove.isError && (
            <GuidanceText
              as="div"
              className="text-body text-err"
              locale={guidance.locale}
              message={apiErrorMessage(guidance.messages.common, remove.error)}
            />
          )}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" disabled={remove.isPending} onClick={() => setConfirmingDelete(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={remove.isPending}
              onClick={() =>
                remove.mutate(recipe.id, { onSuccess: () => setConfirmingDelete(false) })
              }
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
      <Modal
        open={editing}
        onClose={closeEditor}
        title="Edit recipe"
        description={guidance.messages.recipes.editDescription}
        descriptionLocale={guidance.locale}
      >
        <div className="p-4 flex flex-col gap-3">
          <Field label="Title">
            <Input
              value={form.title}
              onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
              disabled={edit.isPending}
              />
          </Field>
          <Field label="Intent">
            <Input
              value={form.intent}
              onChange={(e) => setForm((s) => ({ ...s, intent: e.target.value }))}
              disabled={edit.isPending}
              />
          </Field>
          <Field label="Description">
            <Textarea
              value={form.description}
              onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
              rows={3}
              disabled={edit.isPending}
              />
          </Field>
          <Field label="Summary">
            <Textarea
              value={form.summaryMd}
              onChange={(e) => setForm((s) => ({ ...s, summaryMd: e.target.value }))}
              rows={8}
              disabled={edit.isPending}
              />
          </Field>
          {error && (
            <GuidanceText
              as="div"
              className="text-body text-err"
              locale={guidance.locale}
              message={error}
            />
          )}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" disabled={edit.isPending} onClick={closeEditor}>
              Cancel
            </Button>
            <Button variant="primary" disabled={edit.isPending} onClick={saveEdit}>
              Save
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

function Field({ label, children }: { readonly label: string; readonly children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-body text-ink-muted">
      <span>{label}</span>
      {children}
    </label>
  );
}

function Pill({ children }: { readonly children: React.ReactNode }) {
  return (
    <span className="py-px px-1.5 rounded-pill bg-s1 text-ink-tertiary font-mono">
      {children}
    </span>
  );
}


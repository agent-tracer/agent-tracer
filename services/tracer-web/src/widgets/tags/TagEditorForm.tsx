import { useState } from "react";
import {
  TAG_COLOR_PATTERN,
  TAG_DEFAULT_COLOR,
  TAG_DESCRIPTION_MAX_LENGTH,
  TAG_NAME_MAX_LENGTH,
} from "@agent-tracer/kernel";
import type { TagRecord } from "~tracer-web/entities/tag/model/tag.js";
import {
  useCreateTagMutation,
  useUpdateTagMutation,
} from "~tracer-web/entities/tag/api/mutations.js";
import { apiErrorMessage } from "~tracer-web/shared/api/api-error-message.js";
import type { GuidanceMessage } from "~tracer-web/shared/guidance.js";
import { useGuidance } from "~tracer-web/shared/store/index.js";
import { Button, GuidanceText, Input, Textarea } from "~tracer-web/shared/ui/index.js";
import { TagColorPicker } from "~tracer-web/widgets/tags/TagColorPicker.js";

interface TagEditorFormProps {
  readonly tag?: TagRecord;
  readonly onClose: () => void;
}

/** 태그 생성과 수정이 함께 쓰는 폼이다. */
export function TagEditorForm({ tag, onClose }: TagEditorFormProps) {
  const guidance = useGuidance();
  const isEdit = Boolean(tag);
  const [name, setName] = useState(tag?.name ?? "");
  const [color, setColor] = useState(tag?.color ?? TAG_DEFAULT_COLOR);
  const [description, setDescription] = useState(tag?.description ?? "");
  const [error, setError] = useState<GuidanceMessage | null>(null);
  const createMutation = useCreateTagMutation();
  const updateMutation = useUpdateTagMutation();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = (event: { readonly preventDefault: () => void }) => {
    event.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError(guidance.messages.tags.nameRequired);
      return;
    }
    if (!TAG_COLOR_PATTERN.test(color)) {
      setError(guidance.messages.tags.colorFormat);
      return;
    }

    const trimmedDescription = description.trim();
    const onError = (mutationError: unknown) =>
      setError(apiErrorMessage(guidance.messages.common, mutationError));

    if (isEdit && tag) {
      updateMutation.mutate(
        { tagId: tag.id, body: { name: trimmedName, color, description: trimmedDescription || null } },
        { onSuccess: onClose, onError },
      );
      return;
    }

    createMutation.mutate(
      { name: trimmedName, color, ...(trimmedDescription ? { description: trimmedDescription } : {}) },
      { onSuccess: onClose, onError },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="pt-4 px-4 pb-0 flex flex-col gap-3.5">
      <GuidanceText
        as="p"
        className="m-0 text-meta text-ink-tertiary"
        locale={guidance.locale}
        message={isEdit ? guidance.messages.tags.editDescription : guidance.messages.tags.createDescription}
      />

      <div className="flex flex-col gap-1.5 py-3.5 border-t border-hair">
        <label className="text-body font-medium text-ink tracking-snug">Name</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={TAG_NAME_MAX_LENGTH}
          disabled={isPending}
          autoFocus
        />
      </div>

      <div className="flex flex-col gap-1.5 py-3.5 border-t border-hair">
        <label className="text-body font-medium text-ink tracking-snug">Color</label>
        <TagColorPicker color={color} onChange={setColor} disabled={isPending} />
      </div>

      <div className="flex flex-col gap-1.5 py-3.5 border-t border-hair">
        <label className="text-body font-medium text-ink tracking-snug">Description</label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={TAG_DESCRIPTION_MAX_LENGTH}
          rows={2}
          disabled={isPending}
        />
      </div>

      {error && (
        <div role="alert" className="m-0 text-body text-err leading-normal">
          <GuidanceText locale={guidance.locale} message={error} />
        </div>
      )}

      <footer className="sticky bottom-0 -mx-4 mt-1 py-3 px-4 flex justify-end gap-2 bg-s1 border-t border-hair">
        <Button onClick={onClose} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={isPending}>
          {isPending ? "Saving…" : isEdit ? "Save" : "Create"}
        </Button>
      </footer>
    </form>
  );
}

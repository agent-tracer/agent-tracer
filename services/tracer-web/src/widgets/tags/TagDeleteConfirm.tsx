import type { TagSummaryRecord } from "~tracer-web/entities/tag/model/tag.js";
import { useDeleteTagMutation } from "~tracer-web/entities/tag/api/mutations.js";
import { useGuidance } from "~tracer-web/shared/store/index.js";
import { Button, GuidanceText } from "~tracer-web/shared/ui/index.js";

interface TagDeleteConfirmProps {
  readonly tag: TagSummaryRecord;
  readonly onClose: () => void;
}

/** 태그 삭제가 몇 개의 태스크에서 태그를 떼어내는지 알리고 확인을 받는다. */
export function TagDeleteConfirm({ tag, onClose }: TagDeleteConfirmProps) {
  const guidance = useGuidance();
  const deleteMutation = useDeleteTagMutation();

  const handleDelete = () => {
    deleteMutation.mutate(tag.id, { onSuccess: onClose });
  };

  return (
    <div className="pt-4 px-4 pb-4 flex flex-col gap-3">
      <GuidanceText
        as="p"
        className="m-0 text-body text-ink-subtle leading-normal"
        locale={guidance.locale}
        message={guidance.messages.tags.deleteDescription}
      />
      <p className="m-0 text-body text-ink">
        Deleting <strong>{tag.name}</strong> will detach it from {tag.taskCount} task
        {tag.taskCount === 1 ? "" : "s"}.
      </p>
      {deleteMutation.isError && (
        <p role="alert" className="m-0 text-body text-err">
          Delete failed. Try again.
        </p>
      )}
      <footer className="flex justify-end gap-2 pt-2 border-t border-hair">
        <Button onClick={onClose} disabled={deleteMutation.isPending}>
          Cancel
        </Button>
        <Button
          variant="danger"
          onClick={handleDelete}
          disabled={deleteMutation.isPending}
        >
          {deleteMutation.isPending ? "Deleting…" : "Delete"}
        </Button>
      </footer>
    </div>
  );
}

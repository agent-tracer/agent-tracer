import { useState } from "react";
import type { TagSummaryRecord } from "~tracer-web/entities/tag/model/tag.js";
import { useTagsQuery } from "~tracer-web/entities/tag/api/queries.js";
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
import { TagManagerList } from "~tracer-web/widgets/tags/TagManagerList.js";
import { TagEditorForm } from "~tracer-web/widgets/tags/TagEditorForm.js";
import { TagDeleteConfirm } from "~tracer-web/widgets/tags/TagDeleteConfirm.js";
import { TaggedTaskList } from "~tracer-web/widgets/tags/TaggedTaskList.js";

type EditorState = "closed" | "create" | TagSummaryRecord;

/** `/tags`. 워크스페이스 전체 태그 관리 화면이다. */
export function TagsPage() {
  const guidance = useGuidance();
  const { data, isLoading, isError } = useTagsQuery();
  const [editorState, setEditorState] = useState<EditorState>("closed");
  const [deletingTag, setDeletingTag] = useState<TagSummaryRecord | null>(null);
  const [viewingTag, setViewingTag] = useState<TagSummaryRecord | null>(null);

  const tags = data?.tags ?? [];

  return (
    <div className="flex flex-col min-h-0 h-full overflow-auto">
      <PageHeader
        eyebrow="Workspace"
        title="Tags"
        intro={guidance.messages.tags.workspaceIntroduction}
        introLocale={guidance.locale}
        status={
          isLoading
            ? loadingLabel("tags")
            : data
              ? `${tags.length} tag${tags.length === 1 ? "" : "s"}`
              : loadFailedLabel("tags")
        }
        actions={
          <Button variant="primary" onClick={() => setEditorState("create")}>
            New tag
          </Button>
        }
      />

      <div className="px-9 py-6 flex flex-col gap-2.5">
        {isError && (
          <div className="text-err text-body">
            <p className="m-0">{loadFailedLabel("tags")}</p>
            <GuidanceText
              as="p"
              className="mt-1 mb-0"
              locale={guidance.locale}
              message={guidance.messages.tags.loadError}
            />
          </div>
        )}
        {!isLoading && tags.length === 0 && !isError && (
          <InlineState state="empty">
            <GuidanceText
              locale={guidance.locale}
              message={guidance.messages.tags.workspaceEmpty}
            />
          </InlineState>
        )}
        <TagManagerList
          tags={tags}
          onEdit={setEditorState}
          onDelete={setDeletingTag}
          onViewTasks={setViewingTag}
        />
      </div>

      <Modal
        open={editorState !== "closed"}
        onClose={() => setEditorState("closed")}
        title={editorState === "create" ? "New tag" : "Edit tag"}
      >
        {editorState !== "closed" && (
          <TagEditorForm
            {...(editorState !== "create" ? { tag: editorState } : {})}
            onClose={() => setEditorState("closed")}
          />
        )}
      </Modal>

      <Modal
        open={deletingTag !== null}
        onClose={() => setDeletingTag(null)}
        title="Delete tag"
      >
        {deletingTag && (
          <TagDeleteConfirm tag={deletingTag} onClose={() => setDeletingTag(null)} />
        )}
      </Modal>

      <Modal
        open={viewingTag !== null}
        onClose={() => setViewingTag(null)}
        title={viewingTag ? `Tasks tagged "${viewingTag.name}"` : "Tagged tasks"}
      >
        {viewingTag && <TaggedTaskList tagId={viewingTag.id} />}
      </Modal>
    </div>
  );
}

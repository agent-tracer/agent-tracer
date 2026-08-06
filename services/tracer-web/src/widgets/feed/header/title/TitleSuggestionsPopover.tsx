import { useEffect } from "react";
import type { TitleSuggestion } from "~tracer-web/entities/job/model/title-suggestion.js";
import type { GuidanceMessage } from "~tracer-web/shared/guidance.js";
import { isGuidanceMessage } from "~tracer-web/shared/guidance.js";
import { useGuidance } from "~tracer-web/shared/store/index.js";
import { AnchoredPopover, GuidanceText } from "~tracer-web/shared/ui/index.js";
import { AgentBackendSelect } from "~tracer-web/features/agent-backend/AgentBackendSelect.js";
import { cn } from "~tracer-web/shared/ui/lib/cn.js";

interface TitleSuggestionsPopoverProps {
  readonly anchorRef: { readonly current: HTMLElement | null };
  readonly loading: boolean;
  readonly error: GuidanceMessage | string | null;
  readonly suggestions: readonly TitleSuggestion[];
  readonly currentTitle: string;
  readonly agentBackend: string | null;
  readonly onAgentBackendChange: (backend: string) => void;
  readonly onSuggest: () => void;
  readonly onApply: (title: string) => void;
  readonly onClose: () => void;
}

/** 제목 제안 생성 옵션과 후보 및 잡 피드백을 표시한다. */
export function TitleSuggestionsPopover({
  anchorRef,
  loading,
  error,
  suggestions,
  currentTitle,
  agentBackend,
  onAgentBackendChange,
  onSuggest,
  onApply,
  onClose,
}: TitleSuggestionsPopoverProps) {
  const guidance = useGuidance();

  useEffect(() => {
    const handleKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <AnchoredPopover
      anchorRef={anchorRef}
      preferredWidth={520}
      preferredMaxHeight={480}
      role="dialog"
      aria-label="Title suggestions"
      className="bg-s1 border border-hair rounded-sm shadow-elev-1 p-2.5"
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-meta text-ink-tertiary uppercase tracking-label">
          Suggested titles
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="bg-transparent border-none text-ink-tertiary cursor-pointer text-lead leading-none"
        >
          ×
        </button>
      </div>
      <div className="mb-2 flex min-w-0 items-center gap-2">
        <AgentBackendSelect
          value={agentBackend}
          onChange={onAgentBackendChange}
          disabled={loading}
          className="min-w-0 flex-1 text-meta"
        />
        <button
          type="button"
          onClick={onSuggest}
          disabled={loading}
          className={cn(
            "shrink-0 rounded-xs border px-2.5 py-1.5 text-meta font-medium",
            loading
              ? "cursor-wait border-hair bg-s2 text-ink-subtle"
              : "cursor-pointer border-primary bg-primary text-on-primary",
          )}
        >
          {loading ? "Suggesting…" : "Generate title suggestions"}
        </button>
      </div>
      {loading && (
        <GuidanceText
          as="p"
          className="m-0 text-body text-ink-subtle"
          locale={guidance.locale}
          message={guidance.messages.feed.suggestingTitle}
        />
      )}
      {error && (
        <p className="m-0 text-body text-err [overflow-wrap:anywhere]">
          {isGuidanceMessage(error) ? (
            <GuidanceText locale={guidance.locale} message={error} />
          ) : (
            error
          )}
        </p>
      )}
      {!loading && !error && suggestions.length === 0 && (
        <GuidanceText
          as="p"
          className="m-0 text-body text-ink-subtle"
          locale={guidance.locale}
          message={guidance.messages.feed.currentTitleFine}
        />
      )}
      <ul className="list-none p-0 m-0 grid gap-1.5">
        {suggestions.map((suggestion, index) => (
          <li key={`${index}-${suggestion.title}`} className="min-w-0">
            <button
              type="button"
              onClick={() => onApply(suggestion.title)}
              disabled={suggestion.title === currentTitle}
              className={cn(
                "block w-full text-left py-1.5 px-2 rounded-xs border border-hair bg-s2 text-ink text-body font-medium leading-tight [overflow-wrap:anywhere]",
                suggestion.title === currentTitle
                  ? "cursor-default"
                  : "cursor-pointer",
              )}
            >
              <div>{suggestion.title}</div>
              <div className="text-meta font-normal text-ink-tertiary mt-0.5 leading-tight">
                {suggestion.rationale}
              </div>
            </button>
          </li>
        ))}
      </ul>
    </AnchoredPopover>
  );
}

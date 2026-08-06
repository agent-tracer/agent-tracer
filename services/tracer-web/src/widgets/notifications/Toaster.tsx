import { useToastStore, type Toast } from "~tracer-web/widgets/notifications/toastStore.js";

/** 오른쪽 아래 토스트 영역. */
export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div
      aria-live="polite"
      aria-label="Notifications"
      // 48px TopBar 바로 아래에 위치시켜, 토스트가 브랜드·브레드크럼
      // 행과 겹치지 않게 한다.
      className="fixed right-4 top-14 flex flex-col gap-2 z-[60] pointer-events-none max-w-[360px]"
    >
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
      ))}
    </div>
  );
}

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: () => void;
}) {
  const accent =
    toast.tone === "error"
      ? "var(--err)"
      : toast.tone === "success"
        ? "var(--ok)"
        : "var(--primary)";
  return (
    <div
      role="status"
      className="pointer-events-auto bg-canvas border border-hair rounded-md shadow-elev-1 py-2.5 px-3 min-w-[240px] flex items-start gap-2.5"
      style={{ borderLeft: `3px solid ${accent}` }}
    >
      <div className="flex-1 min-w-0">
        <div className="font-sans font-semibold text-body text-ink tracking-snug">
          {toast.title}
        </div>
        {toast.body && (
          <div className="mt-0.5 font-sans text-body text-ink-subtle leading-normal break-words">
            {toast.body}
          </div>
        )}
        {toast.action && (
          <button
            type="button"
            onClick={() => {
              toast.action!.onClick();
              onDismiss();
            }}
            className="mt-2 py-1 px-2 font-sans text-meta font-semibold bg-transparent rounded-xs cursor-pointer tracking-snug"
            style={{ color: accent, border: `1px solid ${accent}` }}
          >
            {toast.action.label}
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="bg-transparent border-0 text-ink-tertiary cursor-pointer text-lead leading-none p-0.5"
      >
        ×
      </button>
    </div>
  );
}

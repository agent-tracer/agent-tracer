import { Component, type ErrorInfo, type ReactNode } from "react";
import { reportError } from "~tracer-web/shared/lib/error-reporter.js";
import { UiStoreProvider, useGuidance } from "~tracer-web/shared/store/index.js";
import { Button, GuidanceText } from "~tracer-web/shared/ui/index.js";

interface AppErrorBoundaryProps {
  readonly children: ReactNode;
}

interface AppErrorBoundaryState {
  readonly error: Error | null;
}

/** 최상위 안전망. */
export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  override state: AppErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    reportError({ error, ...(info.componentStack ? { componentStack: info.componentStack } : {}) });
  }

  override render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <UiStoreProvider>
        <AppCrashFallback error={error} />
      </UiStoreProvider>
    );
  }
}

function AppCrashFallback({ error }: { readonly error: Error }) {
  const guidance = useGuidance();

  return (
    <div
      role="alert"
      className="min-h-screen flex items-center justify-center p-6 bg-canvas text-ink font-sans"
    >
      <div className="max-w-[520px] w-full py-5 px-[22px] bg-s1 border border-hair rounded-lg">
        <p className="mb-2 font-mono text-meta uppercase tracking-eyebrow text-err">
          Dashboard crashed
        </p>
        <h2 className="mb-3 text-display font-semibold tracking-snug">
          {error.name}: {error.message}
        </h2>
        <GuidanceText
          as="p"
          className="mb-4 text-lead leading-normal text-ink-subtle"
          locale={guidance.locale}
          message={guidance.messages.app.crashRecovery}
        />
        <Button variant="primary" onClick={() => window.location.reload()}>
          Reload dashboard
        </Button>
      </div>
    </div>
  );
}

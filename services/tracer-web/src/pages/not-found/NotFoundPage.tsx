import { Link } from "react-router-dom";
import { EmptyView } from "~tracer-web/shared/ui/index.js";
import { useGuidance } from "~tracer-web/shared/store/index.js";

export default function NotFound() {
  const guidance = useGuidance();

  return (
    <EmptyView
      eyebrow="404"
      title="Page not found"
      description={guidance.messages.app.pageNotFound}
      locale={guidance.locale}
      action={
        <Link
          to="/tasks"
          className="inline-block text-body text-primary-hover border-b border-dotted border-primary focus-ring"
        >
          Back to tasks
        </Link>
      }
    />
  );
}

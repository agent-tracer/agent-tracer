import { useParams } from "react-router-dom";
import { TaskId } from "~tracer-web/shared/identity.js";
import { FeedPanel } from "~tracer-web/widgets/feed/index.js";
import { EmptyView } from "~tracer-web/shared/ui/index.js";

/** `/tasks/:taskId`: 주 Operator 뷰. */
export default function TaskRoute() {
  const { taskId } = useParams<{ taskId: string }>();
  if (!taskId) {
    return <EmptyView eyebrow="404" title="Missing task id" />;
  }
  return <FeedPanel taskId={TaskId(taskId)} />;
}

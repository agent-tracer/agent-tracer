import type { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ActivityIcon,
  BookIcon,
  ChatIcon,
  ChecklistIcon,
  GearIcon,
  NoteIcon,
  TagIcon,
  Tooltip,
} from "~tracer-web/shared/ui/index.js";
import { useRecipesQuery } from "~tracer-web/entities/recipe/api/queries.js";
import { useRulesQuery } from "~tracer-web/entities/rule/api/queries.js";
import { useMemosQuery } from "~tracer-web/entities/memo/api/queries.js";
import { useTagsQuery } from "~tracer-web/entities/tag/api/queries.js";
import { ThemeToggle } from "~tracer-web/widgets/topbar/ThemeToggle.js";
import { hasAgentPath } from "~tracer-web/entities/agent-surface/model/agent-surface.js";
import { useAgentSurface } from "~tracer-web/entities/agent-surface/model/AgentSurfaceProvider.js";
import { cn } from "~tracer-web/shared/ui/lib/cn.js";

/** 오른쪽 액션 영역. */
export function TopActions() {
  return (
    <div className="flex items-center gap-2">
      <RecipesButton />
      <RulesButton />
      <TagsButton />
      <MemosButton />
      <AgentButton path="/chat" label="Chat" tooltip="Chat with the agent" icon={<ChatIcon />} />
      <AgentButton path="/jobs" label="Jobs" tooltip="Agent jobs" icon={<ActivityIcon />} />
      <SettingsButton />
      <span aria-hidden className="w-px h-[18px] bg-hair" />
      <ThemeToggle />
    </div>
  );
}

interface AgentButtonProps {
  readonly path: string;
  readonly label: string;
  readonly tooltip: string;
  readonly icon: ReactNode;
}

/** 에이전트 화면으로 가는 자리이며 그 라우트가 셸에 얹혔을 때만 보인다. */
function AgentButton({ path, label, tooltip, icon }: AgentButtonProps) {
  const surface = useAgentSurface();
  const navigate = useNavigate();
  const location = useLocation();
  const active = location.pathname === path;

  if (!hasAgentPath(surface, path)) return null;

  return (
    <Tooltip content={tooltip} side="bottom">
      <button
        type="button"
        onClick={() => void navigate(path)}
        aria-label={tooltip}
        aria-current={active ? "page" : undefined}
        className={cn(
          "h-7 px-2.5 inline-flex items-center gap-1.5 rounded-sm hover:bg-s1 transition-colors",
          active ? "text-ink bg-s1" : "text-ink-muted bg-transparent",
        )}
      >
        {icon}
        <span className="text-xs font-medium tracking-[-0.05px]">{label}</span>
      </button>
    </Tooltip>
  );
}

function RecipesButton() {
  const { data, isLoading } = useRecipesQuery();
  const navigate = useNavigate();
  const location = useLocation();
  const count = data?.recipes.length ?? 0;
  const active = location.pathname === "/recipes";
  return (
    <Tooltip content="Browse recipes" side="bottom">
      <button
        type="button"
        onClick={() => void navigate("/recipes")}
        aria-label="Browse recipes"
        aria-current={active ? "page" : undefined}
        className={cn(
          "h-7 px-2.5 inline-flex items-center gap-1.5 rounded-sm hover:bg-s1 transition-colors",
          active ? "text-ink bg-s1" : "text-ink-muted bg-transparent",
        )}
      >
        <BookIcon />
        <span className="text-xs font-medium tracking-[-0.05px]">Recipes</span>
        <span
          className={cn(
            "inline-flex items-center justify-center rounded-pill font-mono text-[10px] font-semibold px-1.5 min-w-5 leading-4",
            count > 0
              ? "bg-ink-tertiary text-white"
              : "bg-s1 text-ink-tertiary",
          )}
        >
          {isLoading ? "…" : count}
        </span>
      </button>
    </Tooltip>
  );
}

function MemosButton() {
  const { data, isLoading } = useMemosQuery();
  const navigate = useNavigate();
  const location = useLocation();
  const count = data?.memos.length ?? 0;
  const active = location.pathname === "/memos";

  const onClick = () => {
    void navigate("/memos");
  };

  return (
    <Tooltip content="Browse memos" side="bottom">
      <button
        type="button"
        onClick={onClick}
        aria-label="Browse memos"
        aria-current={active ? "page" : undefined}
        className={cn(
          "h-7 px-2.5 inline-flex items-center gap-1.5 rounded-sm hover:bg-s1 transition-colors",
          active ? "text-ink bg-s1" : "text-ink-muted bg-transparent",
        )}
      >
        <NoteIcon />
        <span className="text-xs font-medium tracking-[-0.05px]">Memos</span>
        <span
          className={cn(
            "inline-flex items-center justify-center rounded-pill font-mono text-[10px] font-semibold px-1.5 min-w-5 leading-4",
            count > 0
              ? "bg-ink-tertiary text-white"
              : "bg-s1 text-ink-tertiary",
          )}
        >
          {isLoading ? "…" : count}
        </span>
      </button>
    </Tooltip>
  );
}

function TagsButton() {
  const { data, isLoading } = useTagsQuery();
  const navigate = useNavigate();
  const location = useLocation();
  const count = data?.tags.length ?? 0;
  const active = location.pathname === "/tags";

  const onClick = () => {
    void navigate("/tags");
  };

  return (
    <Tooltip content="Manage tags" side="bottom">
      <button
        type="button"
        onClick={onClick}
        aria-label="Manage tags"
        aria-current={active ? "page" : undefined}
        className={cn(
          "h-7 px-2.5 inline-flex items-center gap-1.5 rounded-sm hover:bg-s1 transition-colors",
          active ? "text-ink bg-s1" : "text-ink-muted bg-transparent",
        )}
      >
        <TagIcon />
        <span className="text-xs font-medium tracking-[-0.05px]">Tags</span>
        <span
          className={cn(
            "inline-flex items-center justify-center rounded-pill font-mono text-[10px] font-semibold px-1.5 min-w-5 leading-4",
            count > 0
              ? "bg-ink-tertiary text-white"
              : "bg-s1 text-ink-tertiary",
          )}
        >
          {isLoading ? "…" : count}
        </span>
      </button>
    </Tooltip>
  );
}

function SettingsButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const active = location.pathname === "/settings";
  return (
    <Tooltip content="Settings" side="bottom">
      <button
        type="button"
        onClick={() => void navigate("/settings")}
        aria-label="Settings"
        aria-current={active ? "page" : undefined}
        className={cn(
          "h-7 w-7 inline-flex items-center justify-center rounded-sm hover:bg-s1 transition-colors",
          active ? "text-ink bg-s1" : "text-ink-muted bg-transparent",
        )}
      >
        <GearIcon />
      </button>
    </Tooltip>
  );
}

function RulesButton() {
  const { data, isLoading } = useRulesQuery();
  const navigate = useNavigate();
  const location = useLocation();
  const count = data?.rules.length ?? 0;
  const active = location.pathname === "/rules";

  const onClick = () => {
    void navigate("/rules");
  };

  return (
    <Tooltip content="Manage rules" side="bottom">
      <button
        type="button"
        onClick={onClick}
        aria-label="Manage rules"
        aria-current={active ? "page" : undefined}
        className={cn(
          "h-7 px-2.5 inline-flex items-center gap-1.5 rounded-sm hover:bg-s1 transition-colors",
          active ? "text-ink bg-s1" : "text-ink-muted bg-transparent",
        )}
      >
        <ChecklistIcon />
        <span className="text-xs font-medium tracking-[-0.05px]">Rules</span>
        <span
          className={cn(
            "inline-flex items-center justify-center rounded-pill font-mono text-[10px] font-semibold px-1.5 min-w-5 leading-4",
            count > 0
              ? "bg-ink-tertiary text-white"
              : "bg-s1 text-ink-tertiary",
          )}
        >
          {isLoading ? "…" : count}
        </span>
      </button>
    </Tooltip>
  );
}

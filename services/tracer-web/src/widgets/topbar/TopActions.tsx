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

interface TopActionsProps {
  /** 좁은 화면에서는 이름과 세는 수를 접고 아이콘만 남긴다. */
  readonly compact?: boolean;
}

interface NavEntry {
  readonly path: string;
  readonly label: string;
  readonly tooltip: string;
  readonly icon: ReactNode;
  /** 세는 자리가 없는 항목은 생략하고, 아직 못 읽은 수는 null이다. */
  readonly count?: number | null;
  /** 에이전트 라우트가 셸에 얹혔을 때만 보이는 항목. */
  readonly agentOnly?: boolean;
}

/** 오른쪽 액션 영역. */
export function TopActions({ compact = false }: TopActionsProps) {
  const recipes = useRecipesQuery();
  const rules = useRulesQuery();
  const tags = useTagsQuery();
  const memos = useMemosQuery();
  const surface = useAgentSurface();

  const entries: readonly NavEntry[] = [
    {
      path: "/recipes",
      label: "Recipes",
      tooltip: "Browse recipes",
      icon: <BookIcon />,
      count: recipes.isLoading ? null : (recipes.data?.recipes.length ?? 0),
    },
    {
      path: "/rules",
      label: "Rules",
      tooltip: "Manage rules",
      icon: <ChecklistIcon />,
      count: rules.isLoading ? null : (rules.data?.rules.length ?? 0),
    },
    {
      path: "/tags",
      label: "Tags",
      tooltip: "Manage tags",
      icon: <TagIcon />,
      count: tags.isLoading ? null : (tags.data?.tags.length ?? 0),
    },
    {
      path: "/memos",
      label: "Memos",
      tooltip: "Browse memos",
      icon: <NoteIcon />,
      count: memos.isLoading ? null : (memos.data?.memos.length ?? 0),
    },
    {
      path: "/chat",
      label: "Chat",
      tooltip: "Chat with the agent",
      icon: <ChatIcon />,
      agentOnly: true,
    },
    {
      path: "/jobs",
      label: "Jobs",
      tooltip: "Agent jobs",
      icon: <ActivityIcon />,
      agentOnly: true,
    },
  ];

  const visible = entries.filter(
    (entry) => entry.agentOnly !== true || hasAgentPath(surface, entry.path),
  );

  return (
    <div className={cn("flex items-center", compact ? "gap-0.5" : "gap-2")}>
      {visible.map((entry) => (
        <NavButton key={entry.path} entry={entry} compact={compact} />
      ))}
      <SettingsButton />
      <span aria-hidden className="w-px h-[18px] bg-hair shrink-0" />
      <ThemeToggle />
    </div>
  );
}

interface NavButtonProps {
  readonly entry: NavEntry;
  readonly compact: boolean;
}

/** 접힌 화면에서도 tooltip과 aria-label이 이름을 계속 갖는다. */
function NavButton({ entry, compact }: NavButtonProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const active = location.pathname === entry.path;
  const counted = entry.count !== undefined;
  // 접힌 자리에는 수를 적을 폭이 없으므로 0이 아닌 것만 점으로 알린다.
  const marked = compact && counted && (entry.count ?? 0) > 0;

  return (
    <Tooltip content={entry.tooltip} side="bottom">
      <button
        type="button"
        onClick={() => void navigate(entry.path)}
        aria-label={entry.tooltip}
        aria-current={active ? "page" : undefined}
        className={cn(
          "relative h-7 inline-flex items-center gap-1.5 rounded-sm shrink-0 hover:bg-s1 transition-colors",
          compact ? "w-7 justify-center" : "px-2.5",
          active ? "text-ink bg-s1" : "text-ink-muted bg-transparent",
        )}
      >
        {entry.icon}
        {!compact && (
          <>
            <span className="text-xs font-medium tracking-[-0.05px]">{entry.label}</span>
            {counted && <CountBadge count={entry.count ?? null} />}
          </>
        )}
        {marked && (
          <span
            aria-hidden
            className="absolute top-0.5 right-0.5 h-1.5 w-1.5 rounded-pill bg-ink-tertiary"
          />
        )}
      </button>
    </Tooltip>
  );
}

function CountBadge({ count }: { readonly count: number | null }) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-pill font-mono text-[10px] font-semibold px-1.5 min-w-5 leading-4",
        (count ?? 0) > 0 ? "bg-ink-tertiary text-white" : "bg-s1 text-ink-tertiary",
      )}
    >
      {count === null ? "…" : count}
    </span>
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
          "h-7 w-7 inline-flex items-center justify-center rounded-sm shrink-0 hover:bg-s1 transition-colors",
          active ? "text-ink bg-s1" : "text-ink-muted bg-transparent",
        )}
      >
        <GearIcon />
      </button>
    </Tooltip>
  );
}

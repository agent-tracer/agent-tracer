import { defineGuidanceCatalog } from "~tracer-web/shared/guidance-define-catalog.js";
import { KO_COMMON, KO_APP, KO_SHELL } from "~tracer-web/shared/guidance-ko/core.js";
import { KO_SETTINGS } from "~tracer-web/shared/guidance-ko/settings.js";
import { KO_JOBS } from "~tracer-web/shared/guidance-ko/jobs.js";
import { KO_FEED, KO_TASKS } from "~tracer-web/shared/guidance-ko/feed.js";
import {
  KO_RULES,
  KO_RECIPES,
  KO_INSPECTOR,
} from "~tracer-web/shared/guidance-ko/rules.js";
import { KO_MEMOS } from "~tracer-web/shared/guidance-ko/memos.js";
import { KO_TAGS } from "~tracer-web/shared/guidance-ko/tags.js";
import { KO_CHAT } from "~tracer-web/shared/guidance-ko/chat.js";
import { KO_EVALUATION } from "~tracer-web/shared/guidance-ko/evaluation.js";
import type { GuidanceCatalog } from "~tracer-web/shared/guidance-en.js";

export const KO_GUIDANCE = defineGuidanceCatalog({
  common: KO_COMMON,
  app: KO_APP,
  shell: KO_SHELL,
  settings: KO_SETTINGS,
  jobs: KO_JOBS,
  feed: KO_FEED,
  tasks: KO_TASKS,
  rules: KO_RULES,
  recipes: KO_RECIPES,
  inspector: KO_INSPECTOR,
  memos: KO_MEMOS,
  tags: KO_TAGS,
  chat: KO_CHAT,
  evaluation: KO_EVALUATION,
} satisfies GuidanceCatalog);

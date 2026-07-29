import { defineGuidanceCatalog } from "~tracer-web/shared/guidance-define-catalog.js";
import { EN_COMMON, EN_APP, EN_SHELL } from "~tracer-web/shared/guidance-en/core.js";
import { EN_SETTINGS } from "~tracer-web/shared/guidance-en/settings.js";
import { EN_JOBS } from "~tracer-web/shared/guidance-en/jobs.js";
import { EN_FEED, EN_TASKS } from "~tracer-web/shared/guidance-en/feed.js";
import {
  EN_RULES,
  EN_RECIPES,
  EN_INSPECTOR,
} from "~tracer-web/shared/guidance-en/rules.js";
import { EN_MEMOS } from "~tracer-web/shared/guidance-en/memos.js";
import { EN_TAGS } from "~tracer-web/shared/guidance-en/tags.js";
import { EN_CHAT } from "~tracer-web/shared/guidance-en/chat.js";
import { EN_EVALUATION } from "~tracer-web/shared/guidance-en/evaluation.js";

export const EN_GUIDANCE = defineGuidanceCatalog({
  common: EN_COMMON,
  app: EN_APP,
  shell: EN_SHELL,
  settings: EN_SETTINGS,
  jobs: EN_JOBS,
  feed: EN_FEED,
  tasks: EN_TASKS,
  rules: EN_RULES,
  recipes: EN_RECIPES,
  inspector: EN_INSPECTOR,
  memos: EN_MEMOS,
  tags: EN_TAGS,
  chat: EN_CHAT,
  evaluation: EN_EVALUATION,
});

export type GuidanceCatalog = typeof EN_GUIDANCE;

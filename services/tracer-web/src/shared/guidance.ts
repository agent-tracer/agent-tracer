export {
  GUIDANCE_BUNDLES,
  selectGuidanceBundle,
  type GuidanceBundle,
} from "~tracer-web/shared/guidance-catalog.js";
export { EN_GUIDANCE, type GuidanceCatalog } from "~tracer-web/shared/guidance-en.js";
export { KO_GUIDANCE } from "~tracer-web/shared/guidance-ko.js";
export {
  DEFAULT_GUIDANCE_LOCALE,
  GUIDANCE_LOCALES,
  isGuidanceLocale,
  normalizeGuidanceLocale,
  type GuidanceLocale,
} from "~tracer-web/shared/guidance-locale.js";
export {
  createGuidanceMessage,
  guidanceCode,
  guidanceStrong,
  guidanceText,
  isGuidanceMessage,
  type GuidanceCodePart,
  type GuidanceMessage,
  type GuidanceMessagePart,
  type GuidanceStrongPart,
  type GuidanceTextPart,
} from "~tracer-web/shared/guidance-message.js";

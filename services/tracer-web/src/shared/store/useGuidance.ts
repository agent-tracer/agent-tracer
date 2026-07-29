import {
  GUIDANCE_BUNDLES,
  type GuidanceBundle,
} from "~tracer-web/shared/guidance.js";
import { useGuidanceLocale } from "~tracer-web/shared/store/hooks.js";

export function useGuidance(): GuidanceBundle {
  const locale = useGuidanceLocale();
  return GUIDANCE_BUNDLES[locale];
}

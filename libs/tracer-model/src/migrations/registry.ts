import { InitTracerModel1785300000000 } from "./0001-InitTracerModel.js";
import { AddRuleGenerations1785400000000 } from "./0002-AddRuleGenerations.js";

/** 읽기 모델 스키마의 마이그레이션 순서다. */
export const TRACER_MIGRATIONS = [InitTracerModel1785300000000, AddRuleGenerations1785400000000] as const;

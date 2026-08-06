import { InitTracerModel1785300000000 } from "./0001-InitTracerModel.js";
import { AddRuleGenerations1785400000000 } from "./0002-AddRuleGenerations.js";
import { AddRuleGenerationSettings1785500000000 } from "./0003-AddRuleGenerationSettings.js";
import { AddTurnReassignments1785600000000 } from "./0004-AddTurnReassignments.js";
import { AddRecipeApplicability1785700000000 } from "./0005-AddRecipeApplicability.js";

/** 읽기 모델 스키마의 마이그레이션 순서다. */
export const TRACER_MIGRATIONS = [
    InitTracerModel1785300000000,
    AddRuleGenerations1785400000000,
    AddRuleGenerationSettings1785500000000,
    AddTurnReassignments1785600000000,
    AddRecipeApplicability1785700000000,
] as const;

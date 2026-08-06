import { Inject, Injectable } from "@nestjs/common";
import { IsNull, type DataSource } from "typeorm";
import { RecipeEntity } from "@agent-tracer/tracer-model";
import { TRACER_DATA_SOURCE } from "~tracer-api/config/tracer.datasource.token.js";
import type { RecipeDocReaderPort } from "~tracer-api/domain/index/port/recipe.doc.reader.port.js";

/** 색인에 살아 있어야 하는 레시피, 곧 소프트삭제되지 않은 것만 읽기 모델에서 직접 읽는 어댑터다. */
@Injectable()
export class TypeOrmRecipeDocReaderAdapter implements RecipeDocReaderPort {
    constructor(@Inject(TRACER_DATA_SOURCE) private readonly dataSource: DataSource) {}

    async findLiveRecipes(): Promise<readonly RecipeEntity[]> {
        return this.dataSource.getRepository(RecipeEntity).find({ where: { deletedAt: IsNull() } });
    }
}

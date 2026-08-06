import { Inject, Injectable } from "@nestjs/common";
import { RECIPES_ALIAS } from "~tracer-api/domain/index/model/search.index.definitions.js";
import { buildRecipeDocument } from "~tracer-api/support/recipe.document.js";
import {
    RECIPE_DOC_READER,
    type RecipeDocReaderPort,
} from "~tracer-api/domain/index/port/recipe.doc.reader.port.js";
import {
    SEARCH_INDEX_WRITER,
    type SearchIndexWriterPort,
} from "~tracer-api/domain/index/port/search.index.writer.port.js";

/** 재색인은 옛 _source를 그대로 옮겨 매핑에 새로 생긴 칸이 비므로 읽기 모델에서 문서를 다시 지어 덮는다. */
@Injectable()
export class RefreshRecipeDocsUseCase {
    constructor(
        @Inject(RECIPE_DOC_READER) private readonly recipes: RecipeDocReaderPort,
        @Inject(SEARCH_INDEX_WRITER) private readonly searchIndex: SearchIndexWriterPort,
    ) {}

    async execute(): Promise<number> {
        const recipes = await this.recipes.findLiveRecipes();
        for (const recipe of recipes) {
            await this.searchIndex.indexDocument(RECIPES_ALIAS, recipe.id, buildRecipeDocument(recipe));
        }
        return recipes.length;
    }
}

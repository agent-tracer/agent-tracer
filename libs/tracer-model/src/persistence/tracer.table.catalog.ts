import "reflect-metadata";
import { getMetadataArgsStorage } from "typeorm";
import { TRACER_ENTITIES } from "./tracer.entities.js";

// 엔티티 데코레이터에 적힌 실제 테이블명을 돌려주어 TypeORM 의존을 영속 계층 안에 가둔다.
export function tracerTableNames(): string[] {
    return registeredNames((type) => type !== "view");
}

function registeredNames(matches: (type: string | undefined) => boolean): string[] {
    const registered = new Set<unknown>(TRACER_ENTITIES);
    return getMetadataArgsStorage()
        .tables.filter((table) => registered.has(table.target) && matches(table.type))
        .map((table) => table.name ?? "")
        .filter((name) => name !== "");
}

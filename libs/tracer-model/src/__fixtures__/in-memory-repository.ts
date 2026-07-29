import { FindOperator, type DeleteResult, type FindOptionsOrder, type FindOptionsWhere, type ObjectLiteral, type QueryDeepPartialEntity, type Repository, type UpdateResult } from "typeorm";
import { cloneRow, makeQueryBuilder, toComparable } from "./in-memory-query-builder.js";

/** TypeORM Repository 표면 일부만 흉내내는 인메모리 대역이다. */
export interface InMemoryRepository<T extends ObjectLiteral> extends Pick<Repository<T>, "find" | "findOne" | "upsert" | "update" | "delete" | "count" | "createQueryBuilder"> {
    seed(...entities: T[]): void;
    all(): T[];
    snapshot(): T[];
    restore(snapshot: T[]): void;
}

function fieldMatches(actual: unknown, expected: unknown): boolean {
    // IsNull()·In()·LessThan() 외의 FindOperator는 지원하지 않는다.
    if (expected instanceof FindOperator) {
        if (expected.type === "isNull") return actual === null;
        if (expected.type === "in") return (expected.value as unknown[]).includes(actual);
        if (expected.type === "lessThan") {
            const left = toComparable(actual);
            const right = toComparable(expected.value);
            return left !== null && right !== null && left < right;
        }
        return false;
    }
    return actual === expected;
}

function matches<T extends ObjectLiteral>(entity: T, where: FindOptionsWhere<T>): boolean {
    return Object.entries(where).every(([key, value]) => fieldMatches(entity[key as keyof T], value));
}

function matchesWhere<T extends ObjectLiteral>(entity: T, where: FindOptionsWhere<T> | FindOptionsWhere<T>[]): boolean {
    return Array.isArray(where) ? where.some((entry) => matches(entity, entry)) : matches(entity, where);
}

function sorted<T extends ObjectLiteral>(entities: T[], order?: FindOptionsOrder<T>): T[] {
    if (!order) return entities;
    const keys = Object.entries(order) as [keyof T, "ASC" | "DESC"][];
    if (keys.length === 0) return entities;
    return [...entities].sort((a, b) => {
        for (const [field, direction] of keys) {
            const av = a[field];
            const bv = b[field];
            if (av === bv) continue;
            const factor = direction === "DESC" ? -1 : 1;
            return av > bv ? factor : -factor;
        }
        return 0;
    });
}

export function createInMemoryRepository<T extends ObjectLiteral>(): InMemoryRepository<T> {
    let rows: T[] = [];

    return {
        seed(...entities: T[]) {
            rows = [...rows, ...entities];
        },
        createQueryBuilder: ((alias?: string) => makeQueryBuilder(rows, alias ?? "t")) as unknown as Repository<T>["createQueryBuilder"],
        all() {
            return [...rows];
        },
        snapshot() {
            return rows.map(cloneRow);
        },
        restore(snapshot: T[]) {
            rows = snapshot.map(cloneRow);
        },
        // 읽기는 복제본을 주므로 조회한 엔티티를 바꿔도 저장된 행은 그대로다.
        find: ((options?: { where?: FindOptionsWhere<T> | FindOptionsWhere<T>[]; order?: FindOptionsOrder<T>; take?: number }) => {
            const filtered = options?.where ? rows.filter((row) => matchesWhere(row, options.where as FindOptionsWhere<T> | FindOptionsWhere<T>[])) : rows;
            const ordered = sorted(filtered, options?.order).map(cloneRow);
            return Promise.resolve(options?.take !== undefined ? ordered.slice(0, options.take) : ordered);
        }),
        findOne: ((options: { where: FindOptionsWhere<T>; order?: FindOptionsOrder<T> }) => {
            const filtered = rows.filter((row) => matches(row, options.where));
            const found = sorted(filtered, options.order)[0];
            return Promise.resolve(found === undefined ? null : cloneRow(found));
        }),
        count: ((options?: { where?: FindOptionsWhere<T> | FindOptionsWhere<T>[] }) => {
            const filtered = options?.where ? rows.filter((row) => matchesWhere(row, options.where as FindOptionsWhere<T> | FindOptionsWhere<T>[])) : rows;
            return Promise.resolve(filtered.length);
        }),
        // 조건이 맞는 행에만 patch를 덮고 그 수를 affected로 돌려주는 조건부 UPDATE 대역이다.
        update: ((criteria: FindOptionsWhere<T>, patch: QueryDeepPartialEntity<T>) => {
            const targets = rows.filter((row) => matchesWhere(row, criteria));
            for (const row of targets) Object.assign(row, patch);
            return Promise.resolve({ affected: targets.length, raw: [], generatedMaps: [] } as UpdateResult);
        }),
        upsert: ((entityOrEntities: T | T[], conflictKeys: (keyof T & string)[]) => {
            const incoming = Array.isArray(entityOrEntities) ? entityOrEntities : [entityOrEntities];
            for (const entity of incoming) {
                const idx = rows.findIndex((row) => conflictKeys.every((key) => row[key] === entity[key]));
                if (idx >= 0) rows[idx] = entity;
                else rows.push(entity);
            }
            return Promise.resolve({ identifiers: [], generatedMaps: [], raw: [] });
        }),
        delete: ((criteria: FindOptionsWhere<T>) => {
            const before = rows.length;
            rows = rows.filter((row) => !matches(row, criteria));
            const affected = before - rows.length;
            return Promise.resolve({ affected, raw: {} } as DeleteResult);
        }),
    };
}

/** 부분 구현 대역을 Repository 생성자에 넘길 수 있도록 좁힌다. */
export function asRepository<T extends ObjectLiteral>(fake: InMemoryRepository<T>): Repository<T> {
    return fake as unknown as Repository<T>;
}

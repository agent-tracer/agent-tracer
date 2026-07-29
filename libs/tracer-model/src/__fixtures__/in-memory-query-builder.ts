import type { ObjectLiteral } from "typeorm";

export function cloneRow<T extends ObjectLiteral>(row: T): T {
    return Object.assign(Object.create(Object.getPrototypeOf(row) as object) as T, row);
}

function toCamel(column: string): string {
    return column.replace(/_([a-z])/g, (_match, letter: string) => letter.toUpperCase());
}

// alias는 createQueryBuilder에 넘긴 하나만 지원하며, alias 없는 컬럼도 그대로 받는다.
function stripAlias(qualifiedColumn: string, alias: string): string {
    const prefix = `${alias}.`;
    if (!qualifiedColumn.includes(".")) return qualifiedColumn;
    if (!qualifiedColumn.startsWith(prefix)) {
        throw new Error(`in-memory 쿼리빌더 대역은 "${alias}" 외 alias를 지원하지 않는다: ${qualifiedColumn}`);
    }
    return qualifiedColumn.slice(prefix.length);
}

function field<T extends ObjectLiteral>(row: T, qualifiedColumn: string, alias: string): unknown {
    return row[toCamel(stripAlias(qualifiedColumn, alias)) as keyof T];
}

export function toComparable(value: unknown): number | string | null {
    if (value === null || value === undefined) return null;
    if (value instanceof Date) return value.getTime();
    if (typeof value === "string") {
        // bigint 컬럼은 숫자 문자열로 들어오므로 사전식이 아니라 수치로 비교한다.
        if (/^-?\d+$/.test(value)) return Number(value);
        const timestamp = Date.parse(value);
        return !Number.isNaN(timestamp) && /^\d{4}-\d{2}-\d{2}T/.test(value) ? timestamp : value;
    }
    return value as number;
}

// AND/OR/괄호와 비교 연산자, IS [NOT] NULL만 지원하는 최소 WHERE절 평가기다.
function evaluateCondition<T extends ObjectLiteral>(condition: string, row: T, params: Record<string, unknown>, alias: string): boolean {
    // 저장소 계약 대역에는 관측 테이블이 없으므로 EXISTS는 terminal observation이 준비된 경우로 본다.
    if (/^EXISTS\s*\(/i.test(condition.trim())) return !("canceled" in params);
    if (/^observation\./i.test(condition.trim())) return true;
    const isNotNull = /^([\w.]+)\s+IS\s+NOT\s+NULL$/i.exec(condition);
    if (isNotNull) return toComparable(field(row, isNotNull[1] as string, alias)) !== null;

    const isNull = /^([\w.]+)\s+IS\s+NULL$/i.exec(condition);
    if (isNull) return toComparable(field(row, isNull[1] as string, alias)) === null;

    const comparison = /^([\w.]+)\s*(<=|>=|=|<|>)\s*:(\w+)$/.exec(condition);
    if (comparison) {
        const [, column, op, paramName] = comparison as unknown as [string, string, string, string];
        const left = toComparable(field(row, column, alias));
        const right = toComparable(params[paramName]);
        switch (op) {
            case "=":
                return left === right;
            case "<":
                return left !== null && right !== null && left < right;
            case ">":
                return left !== null && right !== null && left > right;
            case "<=":
                return left !== null && right !== null && left <= right;
            case ">=":
                return left !== null && right !== null && left >= right;
        }
    }
    throw new Error(`in-memory 쿼리빌더 대역이 지원하지 않는 조건절: ${condition}`);
}

function evaluateOr<T extends ObjectLiteral>(source: string, row: T, params: Record<string, unknown>, alias: string): [boolean, string] {
    let [value, rest] = evaluateAnd(source, row, params, alias);
    for (;;) {
        const trimmed = rest.trimStart();
        if (!/^OR\s/i.test(trimmed)) return [value, rest];
        const [right, next] = evaluateAnd(trimmed.slice(2), row, params, alias);
        value = value || right;
        rest = next;
    }
}

function evaluateAnd<T extends ObjectLiteral>(source: string, row: T, params: Record<string, unknown>, alias: string): [boolean, string] {
    let [value, rest] = evaluateAtom(source, row, params, alias);
    for (;;) {
        const trimmed = rest.trimStart();
        if (!/^AND\s/i.test(trimmed)) return [value, rest];
        const [right, next] = evaluateAtom(trimmed.slice(3), row, params, alias);
        value = value && right;
        rest = next;
    }
}

function evaluateAtom<T extends ObjectLiteral>(source: string, row: T, params: Record<string, unknown>, alias: string): [boolean, string] {
    const trimmed = source.trimStart();
    if (trimmed.startsWith("(")) {
        let depth = 0;
        let closeIndex = 0;
        for (let i = 0; i < trimmed.length; i += 1) {
            if (trimmed[i] === "(") depth += 1;
            else if (trimmed[i] === ")") {
                depth -= 1;
                if (depth === 0) {
                    closeIndex = i;
                    break;
                }
            }
        }
        const [value] = evaluateOr(trimmed.slice(1, closeIndex), row, params, alias);
        return [value, trimmed.slice(closeIndex + 1)];
    }
    const boundary = /\sAND\s|\sOR\s/i.exec(trimmed);
    const end = boundary ? boundary.index : trimmed.length;
    return [evaluateCondition(trimmed.slice(0, end).trim(), row, params, alias), trimmed.slice(end)];
}

function evaluateClause<T extends ObjectLiteral>(clause: string, row: T, params: Record<string, unknown>, alias: string): boolean {
    const [value] = evaluateOr(clause, row, params, alias);
    return value;
}

// set에 넘긴 함수는 SQL 조각을 내므로 대역이 아는 표현식만 값으로 되돌린다.
function evaluateSetExpression<T extends ObjectLiteral>(sql: string, row: T, params: Record<string, unknown>, alias: string): unknown {
    const coalesce = /^COALESCE\(\s*"?([\w.]+)"?\s*,\s*:(\w+)\s*\)$/i.exec(sql.trim());
    if (coalesce) {
        const current = field(row, coalesce[1] as string, alias);
        return current ?? params[coalesce[2] as string];
    }
    throw new Error(`in-memory 쿼리빌더 대역이 지원하지 않는 set 표현식: ${sql}`);
}

function applyPatch<T extends ObjectLiteral>(row: T, patch: Partial<T>, params: Record<string, unknown>, alias: string): void {
    for (const [key, value] of Object.entries(patch) as [string, unknown][]) {
        const resolved = typeof value === "function" ? evaluateSetExpression(String((value as () => string)()), row, params, alias) : value;
        Object.assign(row, { [key]: resolved });
    }
}

// TypeORM QueryBuilder 대역이며 leftJoin은 조건 평가에 관여하지 않는다.
export function makeQueryBuilder<T extends ObjectLiteral>(rows: T[], alias: string) {
    let patch: Partial<T> = {};
    const parameters: Record<string, unknown> = {};
    const clauses: { clause: string; params: Record<string, unknown> }[] = [];
    const orderKeys: { column: string; direction: "ASC" | "DESC" }[] = [];
    let limitCount: number | undefined;

    const pushClause = (clause: string, params?: Record<string, unknown>) => {
        clauses.push({ clause, params: params ?? {} });
        Object.assign(parameters, params ?? {});
    };

    const matched = () => rows.filter((row) => clauses.every(({ clause, params }) => evaluateClause(clause, row, { ...parameters, ...params }, alias)));

    const builder = {
        update: () => builder,
        set: (values: Partial<T>) => {
            patch = values;
            return builder;
        },
        where: (clause: string, params?: Record<string, unknown>) => {
            pushClause(clause, params);
            return builder;
        },
        andWhere: (clause: string, params?: Record<string, unknown>) => {
            pushClause(clause, params);
            return builder;
        },
        setParameters: (params: Record<string, unknown>) => {
            Object.assign(parameters, params);
            return builder;
        },
        orderBy: (column: string, direction: "ASC" | "DESC") => {
            orderKeys.length = 0;
            orderKeys.push({ column: stripAlias(column, alias), direction });
            return builder;
        },
        addOrderBy: (column: string, direction: "ASC" | "DESC") => {
            orderKeys.push({ column: stripAlias(column, alias), direction });
            return builder;
        },
        limit: (count: number) => {
            limitCount = count;
            return builder;
        },
        leftJoin: () => builder,
        execute: () => {
            const targets = matched();
            for (const row of targets) applyPatch(row, patch, parameters, alias);
            return Promise.resolve({ affected: targets.length, raw: [], generatedMaps: [] });
        },
        getMany: () => {
            const ordered = [...matched()].sort((a, b) => {
                for (const { column, direction } of orderKeys) {
                    const av = toComparable(a[toCamel(column) as keyof T]);
                    const bv = toComparable(b[toCamel(column) as keyof T]);
                    if (av === bv) continue;
                    const cmp = (av as string | number) > (bv as string | number) ? 1 : -1;
                    return direction === "DESC" ? -cmp : cmp;
                }
                return 0;
            });
            const limited = limitCount !== undefined ? ordered.slice(0, limitCount) : ordered;
            return Promise.resolve(limited.map(cloneRow));
        },
    };
    return builder;
}

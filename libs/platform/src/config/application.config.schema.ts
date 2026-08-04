import { z } from "zod";

const dbSchema = z.object({
    /** 이 연결이 말하는 방언이며 sqlite는 로컬 단독 실행 프로파일이 쓴다. */
    driver: z.enum(["postgres", "sqlite"]).default("postgres"),
    /** sqlite 방언에서만 의미가 있는 데이터베이스 파일 경로다. */
    file: z.string().default(""),
    host: z.string().min(1),
    port: z.number().int().positive().max(65535),
    username: z.string().min(1),
    password: z.string(),
    database: z.string().min(1),
});

export const applicationConfigSchema = z.object({
    profile: z.enum(["local", "sqlite", "prd"]),
    ingestApi: z.object({ port: z.number().int().positive().max(65535) }),
    tracerApi: z.object({ port: z.number().int().positive().max(65535) }),
    projector: z.object({ port: z.number().int().positive().max(65535) }),
    listenHost: z.string().min(1),
    eventDb: dbSchema,
    tracerDb: dbSchema,
    kafka: z.object({ brokers: z.array(z.string().min(1)).min(1) }),
    opensearch: z.object({ node: z.string().min(1) }),
    temporal: z.object({ address: z.string().min(1), namespace: z.string().min(1) }),
});

export type ApplicationConfig = z.infer<typeof applicationConfigSchema>;
export type DbConfig = z.infer<typeof dbSchema>;

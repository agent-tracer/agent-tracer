import type { NextFunction, Request, Response } from "express";

/** 상류로 그대로 넘겨야 신원과 본문 해석이 유지되는 헤더다. */
const FORWARDED_HEADERS = ["content-type", "authorization", "x-monitor-user"];

const INGEST_PREFIX = "/ingest/";
const BAD_GATEWAY = 502;

function forwardedHeaders(req: Request): Record<string, string> {
    const headers: Record<string, string> = {};
    for (const name of FORWARDED_HEADERS) {
        const value = req.headers[name];
        if (typeof value === "string") headers[name] = value;
    }
    return headers;
}

async function forward(req: Request, res: Response, target: string): Promise<void> {
    const hasBody = req.method !== "GET" && req.method !== "HEAD";
    const upstream = await fetch(`${target}${req.originalUrl}`, {
        method: req.method,
        headers: forwardedHeaders(req),
        ...(hasBody ? { body: JSON.stringify(req.body ?? {}) } : {}),
    });
    const contentType = upstream.headers.get("content-type");
    if (contentType !== null) res.setHeader("content-type", contentType);
    res.status(upstream.status).send(await upstream.text());
}

/**
 * 수집 경로를 조회 창구와 같은 포트에서 받아 별도 게이트웨이 없이 단일 진입점을 만든다.
 */
export function createIngestProxy(target: string) {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.path.startsWith(INGEST_PREFIX)) {
            next();
            return;
        }
        void forward(req, res, target).catch(() => {
            res.status(BAD_GATEWAY).json({ ok: false, error: { code: "ingest.unreachable" } });
        });
    };
}

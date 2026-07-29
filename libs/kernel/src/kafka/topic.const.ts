export const TOPIC = {
    ingestEvents: "ingest.events",
    notifications: "notifications",
    chatExecutionUpdates: "chat.execution.updates",
} as const;

export type Topic = (typeof TOPIC)[keyof typeof TOPIC];

export const CONSUMER_GROUP = {
    projectorDb: "projector-db",
    projectorSearch: "projector-search",
    projectorOtlp: "projector-otlp",
} as const;

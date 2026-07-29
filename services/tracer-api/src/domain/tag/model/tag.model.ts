import type { TagDto, TagSummaryDto } from "@agent-tracer/kernel";
import type { TagEntity } from "@agent-tracer/tracer-model";

export type { TagDto, TagSummaryDto };

export function mapTag(tag: TagEntity): TagDto {
    return {
        id: tag.id,
        userId: tag.userId,
        name: tag.name,
        color: tag.color,
        description: tag.description,
        createdAt: tag.createdAt.toISOString(),
        updatedAt: tag.updatedAt.toISOString(),
    };
}

export function mapTagSummary(tag: TagEntity, taskCount: number): TagSummaryDto {
    return { ...mapTag(tag), taskCount };
}

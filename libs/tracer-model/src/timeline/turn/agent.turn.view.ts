import { ViewColumn, ViewEntity } from "typeorm";

/** 에이전트 실행 백엔드가 읽는 턴 계약이며 노출한 열 밖은 읽히지 않는다. */
@ViewEntity({
    name: "agent_turn_view",
    expression: `
        SELECT
            t.id AS id,
            t.user_id AS user_id,
            t.task_id AS task_id,
            t.turn_index AS turn_index,
            t.asked_text AS asked_text,
            t.assistant_text AS assistant_text
        FROM turns t
    `,
})
export class AgentTurnView {
    @ViewColumn()
    id!: string;

    @ViewColumn({ name: "user_id" })
    userId!: string;

    @ViewColumn({ name: "task_id" })
    taskId!: string;

    @ViewColumn({ name: "turn_index" })
    turnIndex!: number;

    @ViewColumn({ name: "asked_text" })
    askedText!: string | null;

    @ViewColumn({ name: "assistant_text" })
    assistantText!: string | null;
}

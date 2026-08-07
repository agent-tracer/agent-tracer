import { Column, Entity, PrimaryColumn } from "typeorm";

/** 로컬 프로파일에서 Kafka 컨슈머 오프셋을 대신하는 투영 커서다. */
@Entity({ name: "projection_cursor" })
export class LocalProjectionCursorEntity {
    @PrimaryColumn({ type: "text" })
    name!: string;

    @Column({ name: "applied_seq", type: "integer", default: 0 })
    appliedSeq!: number;
}

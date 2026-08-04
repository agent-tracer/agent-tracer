import { Column, Entity, PrimaryColumn } from "typeorm";
import { timestampColumnType } from "@agent-tracer/platform";

@Entity({ name: "users" })
export class UserEntity {
    @PrimaryColumn({ name: "user_id", type: "text" })
    userId!: string;

    @Column({ type: "text" })
    email!: string;

    @Column({ name: "created_at", type: timestampColumnType() })
    createdAt!: Date;

    static register(userId: string, email: string, now: Date): UserEntity {
        const user = new UserEntity();
        user.userId = userId;
        user.email = email;
        user.createdAt = now;
        return user;
    }
}

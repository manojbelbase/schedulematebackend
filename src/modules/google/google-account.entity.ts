import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { BaseEntity } from "../../common/entities/base.entity";
import { User } from "../users/user.entity";

@Entity("google_accounts")
export class GoogleAccount extends BaseEntity {
    @Column({ name: "user_id", type: "uuid" })
    userId!: string;

    @ManyToOne(() => User, { onDelete: "CASCADE" })
    @JoinColumn({ name: "user_id" })
    user!: User;

    @Index()
    @Column({ name: "google_email", type: "varchar", length: 255, nullable: true })
    googleEmail!: string | null;

    @Column({ name: "access_token", type: "text" })
    accessToken!: string;

    @Column({ name: "refresh_token", type: "text" })
    refreshToken!: string;

    @Column({ name: "expires_at", type: "timestamp", nullable: true })
    expiresAt!: Date | null;
}

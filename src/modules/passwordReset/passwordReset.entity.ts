import { Column, Entity, Index } from "typeorm";
import { BaseEntity } from "../../common/entities/base.entity";

@Entity("password_resets")
export class PasswordReset extends BaseEntity {
    @Index()
    @Column({ name: "user_id", type: "uuid" })
    userId!: string;

    @Index()
    @Column({ name: "hashed_otp", type: "text" })
    hashedOtp!: string;

    @Column({ name: "expires_at", type: "timestamp" })
    expiresAt!: Date;

    @Column({ name: "used", type: "boolean", default: false })
    used!: boolean;
}

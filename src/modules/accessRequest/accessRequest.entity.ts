import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { BaseEntity } from "../../common/entities/base.entity";
import { User } from "../users/user.entity";

export enum AccessRequestStatus {
    PENDING = "pending",
    APPROVED = "approved",
    REJECTED = "rejected",
}

@Entity("access_requests")
export class AccessRequest extends BaseEntity {
    @Index()
    @Column({ name: "user_id", type: "uuid" })
    userId!: string;

    @ManyToOne(() => User, { onDelete: "CASCADE" })
    @JoinColumn({ name: "user_id" })
    user!: User;

    @Column({ name: "requester_email", type: "varchar", length: 255 })
    requesterEmail!: string;

    @Column({ name: "requester_name", type: "varchar", length: 100, nullable: true })
    requesterName!: string | null;

    @Column({ name: "message", type: "text", nullable: true })
    message!: string | null;

    @Column({ name: "status", type: "varchar", length: 20, default: AccessRequestStatus.PENDING })
    status!: AccessRequestStatus;
}

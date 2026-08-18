import { Column, Entity } from "typeorm";
import { BaseEntity } from "../../common/entities/base.entity";

@Entity("users")
export class User extends BaseEntity {
    @Column({ type: "varchar", length: 255, unique: true })
    email!: string;

    @Column({ type: "varchar", length: 100, nullable: true })
    name!: string | null;

    @Column({ name: "password", type: "text", nullable: true })
    password!: string | null;

    @Column({ type: "varchar", length: 100, unique: true, nullable: true })
    username!: string | null;

    @Column({ name: "google_id", type: "varchar", length: 255, unique: true, nullable: true })
    googleId!: string | null;

    toJSON() {
        const { password, googleId, ...safe } = this;
        return safe;
    }
}
import { Column, Entity } from "typeorm";
import { BaseEntity } from "../../../common/entities/base.entity";

@Entity("embedding_config")
export class EmbeddingConfig extends BaseEntity {
    @Column({ name: "name", type: "varchar", length: 100, unique: true })
    name!: string;

    @Column({ name: "is_active", type: "boolean", default: false })
    isActive!: boolean;

    @Column({ name: "active_provider", type: "varchar", length: 100, default: "openrouter" })
    activeProvider!: string;

    @Column({ name: "api_key", type: "varchar", length: 500, default: "" })
    apiKey!: string;

    @Column({ name: "model", type: "varchar", length: 200, default: "" })
    model!: string;

    @Column({ name: "base_url", type: "varchar", length: 500, default: "" })
    baseUrl!: string;

    @Column({ name: "dimension", type: "integer", default: 1536 })
    dimension!: number;
}

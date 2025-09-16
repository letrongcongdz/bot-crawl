import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    OneToMany
} from "typeorm";
import { CompanyThread } from "./CompanyThread.js";
import { Reply } from "./Reply.js";

@Entity({ name: "posts" })
export class Post {
    @PrimaryGeneratedColumn({ name: "id" })
    private id!: number;
    @Column({ name: "reviewer", type: "varchar" })
    private reviewer: string;
    @Column({ name: "content", type: "text" })
    private content: string;
    @Column({ name: "origin_id", type: "varchar", unique: true, nullable: true })
    private originId: string | null;;
    @ManyToOne(() => CompanyThread, company => company.posts, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'company_thread_id' })
    public companyThread: CompanyThread;

    @OneToMany(() => Reply, reply => reply.post, { cascade: true, eager: true })
    public replies!: Reply[];

    constructor(reviewer: string, content: string, originId: string, companyThread: CompanyThread) {
        this.reviewer = reviewer;
        this.content = content;
        this.originId = originId;
        this.companyThread = companyThread;
    }

    getId(): number {
        return this.id;
    }
    setId(id: number) {
        this.id = id;
    }

    getReviewer(): string {
        return this.reviewer;
    }
    setReviewer(reviewer: string) {
        this.reviewer = reviewer;
    }

    getContent(): string {
        return this.content;
    }
    setContent(content: string) {
        this.content = content;
    }

    getOriginId(): string | null {
        return this.originId;
    }
    setOriginId(originId: string) {
        this.originId = originId;
    }

    getCompanyThread(): CompanyThread {
        return this.companyThread;
    }
    setCompanyThread(companyThread: CompanyThread) {
        this.companyThread = companyThread;
    }

    getReplies(): Reply[] {
        return this.replies;
    }
    setReplies(replies: Reply[]) {
        this.replies = replies;
    }
}
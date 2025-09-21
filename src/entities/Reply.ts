import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn
} from "typeorm";
import { Post } from "./Post.js";

@Entity({ name: "replies" })
export class Reply {
    @PrimaryGeneratedColumn({ name: "id" })
    public id!: number;
    @Column({ name: "reviewer", type: "varchar" })
    public reviewer: string;
    @Column({ name: "content", type: "text" })
    public content: string;
    @Column({ name : "reply_origin_id", type: "varchar", unique: true, nullable: true })
    public replyOriginId: string | null;;
    @ManyToOne(() => Post, post => post.replies, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'post_id' })
    public post!: Post;

    constructor(reviewer: string, content: string, replyOriginId: string, post?: Post) {
        this.reviewer = reviewer;
        this.content = content;
        this.replyOriginId = replyOriginId && replyOriginId.trim() !== '' ? replyOriginId : null;
        if (post) this.post = post;
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

    getReplyOriginId(): string | null {
        return this.replyOriginId;
    }
    setReplyOriginId(replyOriginId: string) {
        this.replyOriginId = replyOriginId;
    }

    getPost(): Post {
        return this.post;
    }
    setPost(post: Post) {
        this.post = post;
    }
}
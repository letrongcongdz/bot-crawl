import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToMany
} from "typeorm";
import { Post } from "./Post.js";
@Entity({ name: "company_threads" })
export class CompanyThread {
    @PrimaryGeneratedColumn({ name: "id" })
    public id!: number;
    @Column({ name: "name", type: "varchar", unique: true })
    public name: string;
    @OneToMany(() => Post, post => post.companyThread, { cascade: true })
    public posts!: Post[];

    constructor(name: string, posts?: Post[]) {
        this.name = name;
        if (posts) {
            this.posts = posts;
        }
    }

    getId(): number {
        return this.id;
    }
    setId(id: number) {
        this.id = id;
    }

    getName(): string {
        return this.name;
    }
    setName(name: string) {
        this.name = name;
    }

    getPosts(): Post[] {
        return this.posts;
    }
    setPosts(posts: Post[]) {
        this.posts = posts;
    }
}   
import { AppDataSource } from "../data-source.ts";
import { Post } from "../entities/Post.ts";
export class PostService {
    private repo = AppDataSource.getRepository(Post);

    async getPostByCompanyId(companyId: number) {
        const posts = await this.repo.find({
            where: {
                companyThread: { id: companyId },
                isSent: false
            } as any,
            order: { id: "ASC" }
        });

        // posts.forEach(post => post.isSent = true);

        // await this.repo.save(posts);

        return posts;
    }
}
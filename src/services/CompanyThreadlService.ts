import { AppDataSource } from "../data-source.ts";
import { CompanyThread } from "../entities/CompanyThread.ts";
import { DataNotFoundException } from "../exceptions/DataNotFoundException.ts";
import { mapCompanyDTOToEntity } from "../mapper/CompanyThreadMapper.ts";
import { CompanyThreadDTO } from "../dtos/CompanyThreadDTO.ts";

export class CompanyThreadService {
    private repo = AppDataSource.getRepository(CompanyThread);

    async save(dto: CompanyThreadDTO) {
        console.log(`[CompanyThreadService] Processing company: ${dto.name}`);

        const newCompany = mapCompanyDTOToEntity(dto);

        const existingCompany = await this.repo.findOne({
            where: { name: dto.name },
            relations: ["posts", "posts.replies"]
        });

        if (existingCompany) {
            console.log(`[CompanyThreadService] Found existing company ID: ${existingCompany.id}`);

            const posts = existingCompany.getPosts() || [];
            const existingPostIds = new Set(posts.map(p => p.getOriginId()));
            const existingReplyIds = new Set(
                posts.flatMap(p => p.getReplies() || []).map(r => r.getReplyOriginId())
            );

            const newPosts = [];

            for (const post of newCompany.getPosts() || []) {
                const originId = post.getOriginId();

                if (existingPostIds.has(originId)) {
                    break;
                }

                const filteredReplies = (post.getReplies() || []).filter(r => {
                    const replyOriginId = r.getReplyOriginId();
                    return r.content?.trim() && !existingReplyIds.has(replyOriginId);
                });

                for (const reply of filteredReplies) {
                    reply.setPost(post);
                }

                post.setReplies(filteredReplies);
                post.setCompanyThread(existingCompany);

                newPosts.push(post);
            }

            if (newPosts.length === 0) {
                console.log(`[CompanyThreadService] No new posts for "${dto.name}", skipping.`);
                return;
            }

            existingCompany.setPosts([...posts, ...newPosts]);

            await this.repo.save(existingCompany);
            console.log(`[CompanyThreadService] Updated company "${dto.name}" with ${newPosts.length} new post(s).`);
        } else {
            await this.repo.save(newCompany);
            console.log(`[CompanyThreadService] Saved new company "${dto.name}" with ${newCompany.getPosts().length} post(s).`);
        }
    }

    async findAllCompanies() {
        return await this.repo.find({
            select: ["id", "name"]
        });
    }

    async findDetailCompany(id: number) {
        const company = await this.repo.createQueryBuilder("company")
            .leftJoinAndSelect("company.posts", "post", "post.isSent = :isSent", { isSent: false })
            .leftJoinAndSelect("post.replies", "reply")
            .where("company.id = :id", { id })
            .getOne();

        if (!company) {
            throw new DataNotFoundException("Company not found");
        }

        if (!company.posts?.length) {
            return company;
        }

        const unsentPosts = company.posts;
        unsentPosts.forEach(post => post.isSent = true);

        await AppDataSource.getRepository("Post").save(unsentPosts);

        return company;
    }
}

import { AppDataSource } from "../data-source.ts";
import { CompanyThread } from "../entities/CompanyThread.ts";
import { DataNotFoundException } from "../exceptions/DataNotFoundException.ts";
import { mapCompanyDTOToEntity } from "../mapper/CompanyThreadMapper.ts";
import { CompanyThreadDTO } from "../dtos/CompanyThreadDTO.ts";
import { Cluster } from "puppeteer-cluster";

export class CompanyThreadService {
    private repo = AppDataSource.getRepository(CompanyThread);

    async save(dto: CompanyThreadDTO) {
        const newCompany = mapCompanyDTOToEntity(dto);

        const existingCompany = await this.repo.findOne({
            where: { name: dto.name },
            relations: ["posts", "posts.replies"]
        });

        if (existingCompany) {
            const existingPostIds = new Set(
                existingCompany.getPosts().map(p => p.getOriginId())
            );

            const newPosts = newCompany.getPosts().filter(
                p => !existingPostIds.has(p.getOriginId())
            );

            if (newPosts.length === 0) {
                console.log(`Company "${dto.name}" already exists. No new posts to add. Skipping...`);
                return;
            }

            for (const post of newPosts) {
                const existingReplyIds = new Set(
                    existingCompany.getPosts()
                        .flatMap(p => p.getReplies())
                        .map(r => r.getReplyOriginId())
                );

                const filteredReplies = (post.getReplies() || []).filter(
                    r => !existingReplyIds.has(r.getReplyOriginId())
                );

                post.setReplies(filteredReplies.filter(r => r.content?.trim()));
                existingCompany.getPosts().push(post);
            }

            await this.repo.save(existingCompany);
            console.log(`Company "${dto.name}" updated (merged new posts/replies).`);
        } else {
            await this.repo.save(newCompany);
            console.log(`Company "${dto.name}" saved as new!`);
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
        throw new DataNotFoundException('Company not found');
    }

    if (!company.posts || company.posts.length === 0) {
        return company;
    }

    for (const post of company.posts) {
        post.isSent = true;
    }

    await this.repo.save(company.posts);

    return company;
}

}

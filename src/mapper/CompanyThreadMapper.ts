import { CompanyThreadDTO } from '../dtos/CompanyThreadDTO.ts';
import { CompanyThread } from '../entities/CompanyThread.ts';
import { mapPostDTOToEntity } from './PostMapper.ts';

export function mapCompanyDTOToEntity(dto: CompanyThreadDTO): CompanyThread {
    const company = new CompanyThread(dto.name);

    company.setPosts(dto.posts.map(p => mapPostDTOToEntity(p, company)));

    return company;
}
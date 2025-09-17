import { PostDTO } from '../dtos/PostDTO.ts';
import { Post } from '../entities/Post.ts';
import { CompanyThread } from '../entities/CompanyThread.ts';
import { mapReplyDTOToEntity } from './ReplyMapper.ts';

export function mapPostDTOToEntity(postDTO: PostDTO, company: CompanyThread): Post {
    const post = new Post(postDTO.reviewer, postDTO.content, postDTO.originId, company);

    post.replies = postDTO.replies.map(r => mapReplyDTOToEntity(r, post));

    return post;
}
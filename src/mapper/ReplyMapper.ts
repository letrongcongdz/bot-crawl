import { ReplyDTO } from '../dtos/ReplyDTO.ts';
import { Reply } from '../entities/Reply.ts';
import { Post } from '../entities/Post.ts';

export function mapReplyDTOToEntity(relyDTO: ReplyDTO, post: Post): Reply {
    return new Reply(relyDTO.reviewer, relyDTO.content, relyDTO.replyOriginId, post);
}

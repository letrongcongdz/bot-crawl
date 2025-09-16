import { IsArray, IsNotEmpty, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

export class ReplyDTO {
  @IsString()
  @IsNotEmpty()
  reviewer!: string;

  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsString()
  replyOriginId!: string;
}
import { IsArray, IsNotEmpty, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { ReplyDTO } from "./ReplyDTO.ts";

export class PostDTO {
  @IsString()
  @IsNotEmpty()
  reviewer!: string;

  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsString()
  originId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReplyDTO)
  replies!: ReplyDTO[];
}


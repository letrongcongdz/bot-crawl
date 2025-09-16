import { IsArray, IsNotEmpty, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { PostDTO } from "./PostDTO.ts";

export class CompanyThreadDTO {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PostDTO)
  posts!: PostDTO[];
}

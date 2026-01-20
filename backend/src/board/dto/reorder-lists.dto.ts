import { IsArray, IsString } from 'class-validator';

export class ReorderListsDto {
  @IsArray()
  @IsString({ each: true })
  listIds: string[];
}

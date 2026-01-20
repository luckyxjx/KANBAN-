import { IsArray, IsString, ArrayMinSize } from 'class-validator';

export class ReorderListsDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  listIds: string[];
}

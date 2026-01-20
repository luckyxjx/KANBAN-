import { IsArray, IsString, ArrayMinSize } from 'class-validator';

export class ReorderCardsDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  cardIds: string[];
}

import { IsArray, IsString } from 'class-validator';

export class ReorderCardsDto {
  @IsArray()
  @IsString({ each: true })
  cardIds: string[];
}

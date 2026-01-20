import { IsString, IsInt, Min } from 'class-validator';

export class MoveCardDto {
  @IsString()
  targetListId: string;

  @IsInt()
  @Min(0)
  position: number;
}

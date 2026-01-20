import { IsString, MaxLength } from 'class-validator';

export class CreateListDto {
  @IsString()
  @MaxLength(100)
  name: string;
}

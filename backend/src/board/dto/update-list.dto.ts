import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateListDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;
}

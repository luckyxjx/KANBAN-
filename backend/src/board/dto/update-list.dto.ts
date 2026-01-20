import { IsString, IsOptional, MaxLength, MinLength } from 'class-validator';

export class UpdateListDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;
}

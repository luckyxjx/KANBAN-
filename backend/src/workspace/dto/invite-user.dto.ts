import { IsEmail, IsEnum, IsNotEmpty } from 'class-validator';
import { WorkspaceMemberRole } from '@prisma/client';

export class InviteUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsEnum(WorkspaceMemberRole)
  role: WorkspaceMemberRole;
}

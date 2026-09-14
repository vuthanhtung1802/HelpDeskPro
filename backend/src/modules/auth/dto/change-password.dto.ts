import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'CurrentPass@123' })
  @IsString()
  @MaxLength(72)
  currentPassword!: string;

  @ApiProperty({ minLength: 8, maxLength: 72, example: 'NewStrongPass@456' })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/, {
    message:
      'newPassword must contain uppercase, lowercase, number and special character',
  })
  newPassword!: string;
}

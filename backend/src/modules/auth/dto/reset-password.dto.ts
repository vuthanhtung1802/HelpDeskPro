import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ description: 'One-time password reset token' })
  @IsString()
  @MaxLength(200)
  @Matches(/^[0-9a-f-]{36}\.[0-9a-f]{64}$/i, {
    message: 'token must be a valid password reset token',
  })
  token!: string;

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

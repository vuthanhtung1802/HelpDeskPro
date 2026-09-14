import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AssignTicketDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  agentId!: string;
}

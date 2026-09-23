import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

export enum ChatMessageRole {
  User = 'user',
  Assistant = 'assistant',
}

export class ChatMessageDto {
  @IsEnum(ChatMessageRole)
  role!: ChatMessageRole;

  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  content!: string;
}

export class AskChatDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  messages!: ChatMessageDto[];
}

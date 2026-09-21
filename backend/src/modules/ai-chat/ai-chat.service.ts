import {
  HttpException,
  HttpStatus,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';
import { ChatMessageDto, ChatMessageRole } from './dto/ask-chat.dto';

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
}

@Injectable()
export class AiChatService {
  constructor(private readonly config: ConfigService) {}

  async ask(messages: ChatMessageDto[], role: UserRole) {
    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    const model = this.config.get<string>('GEMINI_MODEL') ?? 'gemini-2.5-flash';
    if (!apiKey) {
      throw new ServiceUnavailableException('Chatbot chưa được cấu hình');
    }

    let response: Response;
    try {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          body: JSON.stringify({
            system_instruction: {
              parts: [{ text: this.systemPrompt(role) }],
            },
            contents: messages.map((message) => ({
              role:
                message.role === ChatMessageRole.Assistant ? 'model' : 'user',
              parts: [{ text: message.content }],
            })),
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 800,
            },
          }),
          signal: AbortSignal.timeout(20_000),
        },
      );
    } catch {
      throw new ServiceUnavailableException(
        'Chatbot tạm thời không phản hồi. Vui lòng thử lại',
      );
    }

    if (response.status === 429) {
      throw new HttpException(
        'Chatbot đã đạt giới hạn sử dụng. Vui lòng thử lại sau',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    if (!response.ok) {
      throw new ServiceUnavailableException(
        'Chatbot tạm thời không phản hồi. Vui lòng thử lại',
      );
    }

    const result = (await response.json()) as GeminiResponse;
    const answer = result.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? '')
      .join('')
      .trim();
    if (!answer) {
      throw new ServiceUnavailableException(
        'Chatbot không thể tạo câu trả lời cho nội dung này',
      );
    }

    return { answer };
  }

  private systemPrompt(role: UserRole): string {
    const audience =
      role === UserRole.AGENT
        ? 'Bạn đang hỗ trợ một nhân viên hỗ trợ khách hàng.'
        : 'Bạn đang hỗ trợ một người dùng của hệ thống.';
    return [
      'Bạn là chatbot hỏi đáp của HelpDesk Pro.',
      audience,
      'Trả lời bằng tiếng Việt, rõ ràng, ngắn gọn và lịch sự.',
      'Chỉ tư vấn và giải đáp câu hỏi; không tuyên bố đã tạo, sửa, đóng hoặc xử lý ticket.',
      'Không yêu cầu hoặc tiết lộ mật khẩu, mã xác thực, token hay API key.',
      'Nếu không chắc chắn, nói rõ giới hạn và khuyên người dùng tạo ticket để được hỗ trợ.',
    ].join(' ');
  }
}

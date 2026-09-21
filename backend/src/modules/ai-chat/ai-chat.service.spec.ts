import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';
import { AiChatService } from './ai-chat.service';
import { ChatMessageRole } from './dto/ask-chat.dto';

describe('AiChatService', () => {
  afterEach(() => jest.restoreAllMocks());

  it('returns the answer from Gemini without exposing the API key in the URL', async () => {
    const config = {
      get: jest.fn((key: string) =>
        key === 'GEMINI_API_KEY' ? 'test-secret' : 'gemini-test',
      ),
    } as unknown as ConfigService;
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          candidates: [{ content: { parts: [{ text: 'Xin chào!' }] } }],
        }),
        { status: 200 },
      ),
    );

    const service = new AiChatService(config);
    await expect(
      service.ask(
        [{ role: ChatMessageRole.User, content: 'Xin chào' }],
        UserRole.USER,
      ),
    ).resolves.toEqual({ answer: 'Xin chào!' });
    expect(fetchMock.mock.calls[0][0]).not.toContain('test-secret');
    expect(fetchMock.mock.calls[0][1]?.headers).toMatchObject({
      'x-goog-api-key': 'test-secret',
    });
  });

  it('rejects requests when Gemini is not configured', async () => {
    const config = { get: jest.fn() } as unknown as ConfigService;
    const service = new AiChatService(config);

    await expect(
      service.ask(
        [{ role: ChatMessageRole.User, content: 'Xin chào' }],
        UserRole.AGENT,
      ),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});

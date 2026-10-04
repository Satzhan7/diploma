import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ChatsService } from './chats.service';

describe('ChatsService.startForUser', () => {
  const setup = (shared: boolean) => {
    const query = jest
      .fn()
      .mockResolvedValue(shared ? [{ '?column?': 1 }] : []);
    const repository = {
      manager: { query },
      findOne: jest.fn().mockResolvedValue({ id: 'chat-1' }),
    };
    const service = new ChatsService(repository as any, {} as any);
    return { service, query, repository };
  };

  it('refuses a chat with yourself', async () => {
    const { service, query } = setup(true);
    await expect(service.startForUser('u1', 'u1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(query).not.toHaveBeenCalled();
  });

  it('refuses a pair without a shared application or deal', async () => {
    const { service, repository } = setup(false);
    await expect(service.startForUser('u1', 'u2')).rejects.toMatchObject({
      response: { code: 'CHAT_NOT_ALLOWED' },
    });
    await expect(service.startForUser('u1', 'u2')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(repository.findOne).not.toHaveBeenCalled();
  });

  it('checks the application in both directions and opens the chat', async () => {
    const { service, query } = setup(true);
    await expect(service.startForUser('u1', 'u2')).resolves.toEqual({
      id: 'chat-1',
    });
    const [sql, params] = query.mock.calls[0];
    expect(sql).toContain('app."applicantId" = $1 AND brand.user_id = $2');
    expect(sql).toContain('app."applicantId" = $2 AND brand.user_id = $1');
    expect(params).toEqual(['u1', 'u2']);
  });
});

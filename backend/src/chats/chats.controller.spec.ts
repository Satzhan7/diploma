import { ChatsController } from './chats.controller';

describe('ChatsController response projection', () => {
  const user = (id: string) => ({
    id,
    name: `User ${id}`,
    role: 'brand',
    email: `${id}@example.test`,
    password: '$2b$10$password-hash',
    refreshToken: '$2b$10$refresh-hash',
  });
  const chat = {
    id: 'chat-1',
    sender: user('u1'),
    recipient: user('u2'),
    unreadCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    messages: [
      {
        id: 'm1',
        content: 'hi',
        senderId: 'u1',
        recipientId: 'u2',
        isRead: false,
        createdAt: new Date(),
        sender: user('u1'),
      },
    ],
  };
  const message = { ...chat.messages[0], recipient: user('u2') };
  const controller = new ChatsController({
    findAll: jest.fn().mockResolvedValue({ chats: [chat], total: 1 }),
    findOne: jest.fn().mockResolvedValue(chat),
    startForUser: jest.fn().mockResolvedValue(chat),
    addMessage: jest.fn().mockResolvedValue(message),
  } as any);
  const me = { id: 'u1', sub: 'u1', role: 'brand' } as any;

  it.each([
    ['GET /chats', () => controller.findAll(me, { take: 20, skip: 0 })],
    ['GET /chats/:id', () => controller.findOne('chat-1', me)],
    ['POST /chats/:recipientId', () => controller.create('u2', me)],
    [
      'POST /chats/:id/messages',
      () => controller.addMessage('chat-1', 'hi', me),
    ],
  ])('%s returns no email or hashes', async (_route, call) => {
    const body = JSON.stringify(await call());
    expect(body).toContain('"id":"u2"');
    expect(body).not.toMatch(/email|password|refreshToken|\$2b\$/);
  });
});

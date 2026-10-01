import { JwtService } from '@nestjs/jwt';
import { ChatsGateway } from './chats.gateway';

describe('ChatsGateway authentication', () => {
  const accessSecret = 'test-access-secret';
  let jwtService: JwtService;
  let gateway: ChatsGateway;

  const client = (token: string) => ({
    id: 'socket-1',
    handshake: { auth: { token }, headers: {} },
    disconnect: jest.fn(),
    join: jest.fn(),
  });

  beforeEach(() => {
    jwtService = new JwtService({ secret: accessSecret });
    gateway = new ChatsGateway(jwtService, {} as any);
  });

  it('accepts an access token for Socket.IO authentication', async () => {
    const token = await jwtService.signAsync({
      sub: 'user-1',
      email: 'user@example.test',
      tokenType: 'access',
    });
    const socket = client(token);

    await gateway.handleConnection(socket as any);

    expect(socket.disconnect).not.toHaveBeenCalled();
    expect(socket.join).toHaveBeenCalledWith('user:user-1');
  });

  it('rejects refresh, malformed, and expired tokens for Socket.IO authentication', async () => {
    const refreshToken = await jwtService.signAsync({
      sub: 'user-1',
      email: 'user@example.test',
      tokenType: 'refresh',
    });
    const expiredToken = await jwtService.signAsync(
      { sub: 'user-1', email: 'user@example.test', tokenType: 'access' },
      { expiresIn: '-1s' },
    );

    for (const token of [refreshToken, 'not-a-jwt', expiredToken]) {
      const socket = client(token);
      await gateway.handleConnection(socket as any);
      expect(socket.disconnect).toHaveBeenCalledTimes(1);
      expect(socket.join).not.toHaveBeenCalled();
    }
  });
});

describe('ChatsGateway event payloads', () => {
  const user = (id: string) => ({
    id,
    name: `User ${id}`,
    email: `${id}@example.test`,
    role: 'brand',
    password: '$2b$10$password-hash',
    refreshToken: '$2b$10$refresh-hash',
    isEmailVerified: true,
  });

  // Collects every key at any depth so nested relations cannot hide a hash.
  const allKeys = (value: unknown): string[] => {
    if (Array.isArray(value)) return value.flatMap(allKeys);
    if (value && typeof value === 'object' && !(value instanceof Date)) {
      return Object.entries(value).flatMap(([k, v]) => [k, ...allKeys(v)]);
    }
    return [];
  };

  let emitted: { room: string; event: string; payload: unknown }[];
  let gateway: ChatsGateway;

  beforeEach(() => {
    emitted = [];
    gateway = new ChatsGateway({} as any, {} as any);
    gateway.server = {
      to: (room: string) => ({
        emit: (event: string, payload: unknown) => {
          emitted.push({ room, event, payload });
          return true;
        },
      }),
    } as any;
  });

  const chat = () =>
    ({
      id: 'chat-1',
      sender: user('u1'),
      recipient: user('u2'),
      unreadCount: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    }) as any;

  const expectNoSecrets = () => {
    expect(emitted.length).toBeGreaterThan(0);
    for (const { payload } of emitted) {
      const keys = allKeys(payload);
      expect(keys).not.toContain('password');
      expect(keys).not.toContain('refreshToken');
      expect(keys).not.toContain('email');
      expect(JSON.stringify(payload)).not.toContain('$2b$');
    }
  };

  it('emitNewMessage sends no password, refreshToken or email', async () => {
    const c = chat();
    const message = {
      id: 'm1',
      content: 'hi',
      sender: c.sender,
      recipient: c.recipient,
      chat: c,
      isRead: false,
      createdAt: new Date(),
    } as any;

    await gateway.emitNewMessage(message, c);

    expectNoSecrets();
    const newMessage = emitted.find((e) => e.event === 'newMessage');
    expect(newMessage?.payload).toMatchObject({
      id: 'm1',
      chat: { id: 'chat-1' },
      sender: { id: 'u1', name: 'User u1' },
      recipient: { id: 'u2' },
    });
  });

  it('emitNewChat sends no password, refreshToken or email', () => {
    gateway.emitNewChat(chat());

    expectNoSecrets();
    expect(emitted.map((e) => e.room)).toEqual(['user:u1', 'user:u2']);
  });

  it('emitMessagesRead sends ids only', () => {
    gateway.emitMessagesRead('chat-1', 'u1');

    expectNoSecrets();
  });
});

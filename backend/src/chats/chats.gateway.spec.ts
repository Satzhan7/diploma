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

import 'dotenv/config';
import { DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Profile } from '../profiles/entities/profile.entity';
import { SocialMedia } from '../profiles/entities/social-media.entity';
import { Order } from '../orders/entities/order.entity';
import { OrderApplication } from '../orders/entities/order-application.entity';
import { Deal } from '../deals/entities/deal.entity';
import { Chat } from '../chats/entities/chat.entity';
import { Message } from '../chats/entities/message.entity';
import { StoredFile } from '../files/entities/stored-file.entity';
import { CreatorVerification } from '../verification/entities/creator-verification.entity';
import { AuditLog } from '../admin/entities/audit-log.entity';
import { EmailVerification } from '../auth/entities/email-verification.entity';

// CLI-only datasource for reviewed migrations. Runtime configuration remains in
// AppModule; neither path enables synchronize in production.
export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'diploma',
  entities: [
    User,
    Profile,
    SocialMedia,
    Order,
    OrderApplication,
    Chat,
    Message,
    Deal,
    EmailVerification,
    StoredFile,
    CreatorVerification,
    AuditLog,
  ],
  // ts-node runs the .ts sources; dist only loads .js (not the emitted .d.ts).
  migrations: [
    `${__dirname}/migrations/*.${__filename.endsWith('.ts') ? 'ts' : 'js'}`,
  ],
  synchronize: false,
});

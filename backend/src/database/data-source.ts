import 'dotenv/config';
import { DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Profile } from '../profiles/entities/profile.entity';
import { SocialMedia } from '../profiles/entities/social-media.entity';
import { Order } from '../orders/entities/order.entity';
import { OrderApplication } from '../orders/entities/order-application.entity';
import { Match } from '../matching/entities/match.entity';
import { Chat } from '../chats/entities/chat.entity';
import { Message } from '../chats/entities/message.entity';
import { Collaboration } from '../collaborations/entities/collaboration.entity';

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
    Match,
    Chat,
    Message,
    Collaboration,
  ],
  migrations: [`${__dirname}/migrations/*{.ts,.js}`],
  synchronize: false,
});

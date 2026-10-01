import { User } from './entities/user.entity';

// Fields any authenticated user may see about another user. Email, password
// and refresh-token hashes are never part of it.
export type PublicUser = Pick<
  User,
  'id' | 'name' | 'firstName' | 'lastName' | 'role' | 'createdAt'
> &
  Partial<Pick<User, 'profile'>>;

export function toPublicUser(user: User): PublicUser {
  const publicUser: PublicUser = {
    id: user.id,
    name: user.name,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    createdAt: user.createdAt,
  };
  if (user.profile) publicUser.profile = user.profile;
  return publicUser;
}

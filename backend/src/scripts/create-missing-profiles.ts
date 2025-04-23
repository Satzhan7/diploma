import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UsersService } from '../users/users.service';
import { ProfilesService } from '../profiles/profiles.service';
import { ProfileType } from '../profiles/entities/profile.entity';
import { UserRole } from '../users/entities/user.entity';

/**
 * This script finds users without profiles and creates profiles for them.
 * Run with: npx ts-node -r tsconfig-paths/register src/scripts/create-missing-profiles.ts
 */
async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    const usersService = app.get(UsersService);
    const profilesService = app.get(ProfilesService);
    
    console.log('Starting to process users without profiles...');
    
    // Get all users
    const users = await usersService.findAll();
    console.log(`Found ${users.length} users total`);
    
    let created = 0;
    let errors = 0;
    
    // Process each user
    for (const user of users) {
      try {
        // Try to find existing profile
        try {
          await profilesService.findByUserId(user.id);
          // If we reach here, the profile exists
          console.log(`User ${user.id} already has a profile, skipping`);
        } catch (error) {
          // Profile not found, create one
          console.log(`Creating profile for user ${user.id} (${user.name}) with role ${user.role}`);
          const profileType = user.role === UserRole.BRAND ? ProfileType.BRAND : ProfileType.INFLUENCER;
          await profilesService.createProfile(user.id, profileType);
          created++;
        }
      } catch (error) {
        console.error(`Error processing user ${user.id}: ${error.message}`);
        errors++;
      }
    }
    
    console.log(`Process completed. Created ${created} profiles. Encountered ${errors} errors.`);
    
  } catch (error) {
    console.error('Error running script:', error);
  } finally {
    await app.close();
  }
}

bootstrap(); 
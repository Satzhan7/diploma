import { User, UserRole } from '../types/user';

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john@example.com',
    role: UserRole.INFLUENCER,
    createdAt: new Date('2023-01-01').toISOString(),
    updatedAt: new Date('2023-01-01').toISOString(),
    profile: {
      id: '1',
      displayName: 'John Smith',
      bio: 'Digital content creator specializing in tech reviews and tutorials',
      avatarUrl: 'https://i.pravatar.cc/150?img=1',
      websiteUrl: 'https://johnsmith.com',
      location: 'San Francisco, CA',
      niches: ['Technology', 'Gaming', 'Education'],
      contentTypes: ['Video Reviews', 'Tutorials', 'Live Streams'],
      languages: ['English', 'Spanish'],
      followersCount: 150000,
      socialMedia: [
        {
          id: '1',
          type: 'instagram',
          url: 'https://instagram.com/johnsmith',
          username: 'johnsmith',
          followers: 75000
        },
        {
          id: '2',
          type: 'youtube',
          url: 'https://youtube.com/johnsmith',
          username: 'johnsmith',
          followers: 50000
        },
        {
          id: '3',
          type: 'tiktok',
          url: 'https://tiktok.com/@johnsmith',
          username: 'johnsmith',
          followers: 25000
        }
      ]
    }
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah@example.com',
    role: UserRole.INFLUENCER,
    createdAt: new Date('2023-02-01').toISOString(),
    updatedAt: new Date('2023-02-01').toISOString(),
    profile: {
      id: '2',
      displayName: 'Sarah Johnson',
      bio: 'Fashion and lifestyle influencer sharing daily inspiration',
      avatarUrl: 'https://i.pravatar.cc/150?img=2',
      websiteUrl: 'https://sarahjohnson.com',
      location: 'New York, NY',
      niches: ['Fashion', 'Lifestyle', 'Beauty'],
      contentTypes: ['Photo Shoots', 'Style Guides', 'Makeup Tutorials'],
      languages: ['English'],
      followersCount: 200000,
      socialMedia: [
        {
          id: '4',
          type: 'instagram',
          url: 'https://instagram.com/sarahjohnson',
          username: 'sarahjohnson',
          followers: 120000
        },
        {
          id: '5',
          type: 'tiktok',
          url: 'https://tiktok.com/@sarahjohnson',
          username: 'sarahjohnson',
          followers: 80000
        }
      ]
    }
  },
  {
    id: '3',
    name: 'TechBrand Inc',
    email: 'contact@techbrand.com',
    role: UserRole.BRAND,
    createdAt: new Date('2023-03-01').toISOString(),
    updatedAt: new Date('2023-03-01').toISOString(),
    profile: {
      id: '3',
      displayName: 'TechBrand Inc',
      bio: 'Leading technology company specializing in innovative solutions',
      avatarUrl: 'https://i.pravatar.cc/150?img=3',
      websiteUrl: 'https://techbrand.com',
      location: 'Silicon Valley, CA',
      companyName: 'TechBrand Inc',
      industry: 'Technology',
      categories: ['Software', 'Hardware', 'AI'],
      socialMedia: [
        {
          id: '6',
          type: 'linkedin',
          url: 'https://linkedin.com/company/techbrand',
          username: 'techbrand',
          followers: 100000
        },
        {
          id: '7',
          type: 'twitter',
          url: 'https://twitter.com/techbrand',
          username: 'techbrand',
          followers: 50000
        }
      ]
    }
  },
  {
    id: '4',
    name: 'Fashion House',
    email: 'info@fashionhouse.com',
    role: UserRole.BRAND,
    createdAt: new Date('2023-04-01').toISOString(),
    updatedAt: new Date('2023-04-01').toISOString(),
    profile: {
      id: '4',
      displayName: 'Fashion House',
      bio: 'Premium fashion brand offering luxury clothing and accessories',
      avatarUrl: 'https://i.pravatar.cc/150?img=4',
      websiteUrl: 'https://fashionhouse.com',
      location: 'Paris, France',
      companyName: 'Fashion House',
      industry: 'Fashion',
      categories: ['Luxury', 'Clothing', 'Accessories'],
      socialMedia: [
        {
          id: '8',
          type: 'instagram',
          url: 'https://instagram.com/fashionhouse',
          username: 'fashionhouse',
          followers: 200000
        },
        {
          id: '9',
          type: 'facebook',
          url: 'https://facebook.com/fashionhouse',
          username: 'fashionhouse',
          followers: 150000
        }
      ]
    }
  },
  {
    id: '5',
    name: 'Mike Chen',
    email: 'mike@example.com',
    role: UserRole.INFLUENCER,
    createdAt: new Date('2023-05-01').toISOString(),
    updatedAt: new Date('2023-05-01').toISOString(),
    profile: {
      id: '5',
      displayName: 'Mike Chen',
      bio: 'Food and travel content creator exploring Asian cuisine',
      avatarUrl: 'https://i.pravatar.cc/150?img=5',
      websiteUrl: 'https://mikechen.com',
      location: 'Los Angeles, CA',
      niches: ['Food', 'Travel', 'Asian Culture'],
      contentTypes: ['Food Reviews', 'Travel Vlogs', 'Cooking Tutorials'],
      languages: ['English', 'Mandarin', 'Japanese'],
      followersCount: 180000,
      socialMedia: [
        {
          id: '10',
          type: 'youtube',
          url: 'https://youtube.com/mikechen',
          username: 'mikechen',
          followers: 100000
        },
        {
          id: '11',
          type: 'instagram',
          url: 'https://instagram.com/mikechen',
          username: 'mikechen',
          followers: 80000
        }
      ]
    }
  }
]; 
// Mock data for the frontend while the backend is not ready

// Mock influencers data
export const mockInfluencers = [
  {
    id: '1',
    name: 'John Doe',
    avatarUrl: 'https://randomuser.me/api/portraits/men/1.jpg',
    bio: 'Travel and lifestyle content creator with 100K+ followers',
    followers: 120000,
    engagementRate: 0.045,
    categories: ['Travel', 'Lifestyle', 'Food'],
    languages: ['English', 'Spanish'],
  },
  {
    id: '2',
    name: 'Jane Smith',
    avatarUrl: 'https://randomuser.me/api/portraits/women/2.jpg',
    bio: 'Fashion and beauty influencer with a passion for sustainable fashion',
    followers: 85000,
    engagementRate: 0.052,
    categories: ['Fashion', 'Beauty', 'Sustainability'],
    languages: ['English', 'French'],
  },
  {
    id: '3',
    name: 'Mike Johnson',
    avatarUrl: 'https://randomuser.me/api/portraits/men/3.jpg',
    bio: 'Tech reviewer and gadget enthusiast',
    followers: 75000,
    engagementRate: 0.038,
    categories: ['Technology', 'Gadgets', 'Reviews'],
    languages: ['English'],
  },
];

// Mock brands data
export const mockBrands = [
  {
    id: '1',
    name: 'TechCorp',
    avatarUrl: 'https://via.placeholder.com/150',
    description: 'Leading technology company specializing in consumer electronics',
    industry: 'Technology',
    location: 'San Francisco, CA',
    activeOrders: 5,
    totalSpent: 25000,
  },
  {
    id: '2',
    name: 'Fashionista',
    avatarUrl: 'https://via.placeholder.com/150',
    description: 'Premium fashion brand for modern women',
    industry: 'Fashion',
    location: 'New York, NY',
    activeOrders: 3,
    totalSpent: 18000,
  },
  {
    id: '3',
    name: 'EcoLife',
    avatarUrl: 'https://via.placeholder.com/150',
    description: 'Sustainable lifestyle products for eco-conscious consumers',
    industry: 'Lifestyle',
    location: 'Portland, OR',
    activeOrders: 2,
    totalSpent: 12000,
  },
];

// Mock orders data
export const mockOrders = [
  {
    id: '1',
    title: 'Summer Collection Promotion',
    description: 'Looking for influencers to promote our new summer collection',
    budget: 1500,
    category: 'Fashion',
    requirements: 'Instagram posts and stories, minimum 50K followers',
    deadline: '2023-06-15',
    status: 'open',
    brand: {
      id: '2',
      name: 'Fashionista',
      logoUrl: 'https://via.placeholder.com/150',
    },
    createdAt: '2023-05-01',
    updatedAt: '2023-05-01',
  },
  {
    id: '2',
    title: 'Tech Gadget Review',
    description: 'Need tech influencers to review our new smartphone',
    budget: 2000,
    category: 'Technology',
    requirements: 'YouTube review video, minimum 30K subscribers',
    deadline: '2023-06-30',
    status: 'open',
    brand: {
      id: '1',
      name: 'TechCorp',
      logoUrl: 'https://via.placeholder.com/150',
    },
    createdAt: '2023-05-05',
    updatedAt: '2023-05-05',
  },
  {
    id: '3',
    title: 'Sustainable Living Campaign',
    description: 'Promoting eco-friendly products for sustainable living',
    budget: 1200,
    category: 'Lifestyle',
    requirements: 'Instagram and TikTok content, focus on sustainability',
    deadline: '2023-07-15',
    status: 'open',
    brand: {
      id: '3',
      name: 'EcoLife',
      logoUrl: 'https://via.placeholder.com/150',
    },
    createdAt: '2023-05-10',
    updatedAt: '2023-05-10',
  },
];

// Mock applications data
export const mockApplications = [
  {
    id: '1',
    message: 'I would love to promote your summer collection! I have experience in fashion content creation.',
    proposedPrice: 1300,
    status: 'pending',
    createdAt: '2023-05-02',
    order: mockOrders[0],
  },
  {
    id: '2',
    message: 'I specialize in tech reviews and would be excited to review your new smartphone.',
    proposedPrice: 1800,
    status: 'accepted',
    createdAt: '2023-05-06',
    order: mockOrders[1],
  },
  {
    id: '3',
    message: 'As an eco-conscious influencer, I align perfectly with your sustainable living campaign.',
    proposedPrice: 1100,
    status: 'rejected',
    createdAt: '2023-05-11',
    order: mockOrders[2],
  },
];

// Mock collaborations data
export const mockCollaborations = [
  {
    id: '1',
    brand: {
      id: '2',
      name: 'Fashionista',
      avatarUrl: 'https://via.placeholder.com/150',
    },
    influencer: {
      id: '1',
      name: 'John Doe',
      avatarUrl: 'https://randomuser.me/api/portraits/men/1.jpg',
    },
    order: {
      id: '1',
      title: 'Summer Collection Promotion',
      budget: 1500,
    },
    status: 'active',
    progress: 60,
    startDate: '2023-05-15',
    endDate: '2023-06-15',
  },
  {
    id: '2',
    brand: {
      id: '1',
      name: 'TechCorp',
      avatarUrl: 'https://via.placeholder.com/150',
    },
    influencer: {
      id: '3',
      name: 'Mike Johnson',
      avatarUrl: 'https://randomuser.me/api/portraits/men/3.jpg',
    },
    order: {
      id: '2',
      title: 'Tech Gadget Review',
      budget: 2000,
    },
    status: 'active',
    progress: 30,
    startDate: '2023-05-20',
    endDate: '2023-06-30',
  },
];

// Mock chats data
export const mockChats = [
  {
    id: '1',
    participant: {
      id: '1',
      name: 'John Doe',
      avatarUrl: 'https://randomuser.me/api/portraits/men/1.jpg',
    },
    lastMessage: {
      content: 'When can you deliver the content?',
      timestamp: '2023-05-10T14:30:00Z',
      isRead: false,
    },
    unreadCount: 1,
  },
  {
    id: '2',
    participant: {
      id: '3',
      name: 'Mike Johnson',
      avatarUrl: 'https://randomuser.me/api/portraits/men/3.jpg',
    },
    lastMessage: {
      content: 'I\'ve sent the review draft for your approval',
      timestamp: '2023-05-09T10:15:00Z',
      isRead: true,
    },
    unreadCount: 0,
  },
];

// Mock messages data
export const mockMessages = [
  {
    id: '1',
    content: 'Hi, I saw your application for our summer collection promotion',
    senderId: '2',
    timestamp: '2023-05-10T14:00:00Z',
    isRead: true,
  },
  {
    id: '2',
    content: 'Yes, I\'m very interested in collaborating with Fashionista',
    senderId: '1',
    timestamp: '2023-05-10T14:15:00Z',
    isRead: true,
  },
  {
    id: '3',
    content: 'When can you deliver the content?',
    senderId: '2',
    timestamp: '2023-05-10T14:30:00Z',
    isRead: false,
  },
];

// Mock user settings
export const mockUserSettings = {
  emailNotifications: true,
  pushNotifications: true,
  language: 'en',
  timezone: 'UTC',
}; 
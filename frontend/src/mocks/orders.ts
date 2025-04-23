import { Order, OrderStatus } from '../types/order';
import { mockUsers } from './users';

export const mockOrders: Order[] = [
  {
    id: '1',
    title: 'Tech Product Review Campaign',
    description: 'Looking for tech influencers to review our new smart home device. Must have experience in tech reviews and at least 50k followers.',
    budget: 1000,
    category: 'Technology',
    requirements: 'Minimum 50k followers, tech review experience, high-quality video content',
    deadline: '2024-05-01',
    status: OrderStatus.OPEN,
    brand: mockUsers[2], // TechBrand Inc
    applications: [
      {
        id: '1',
        message: 'I have extensive experience in tech reviews and would love to collaborate on this campaign.',
        proposedPrice: 1200,
        status: 'pending',
        createdAt: '2024-03-15',
        applicant: mockUsers[0] // John Smith
      }
    ],
    createdAt: '2024-03-01',
    updatedAt: '2024-03-15'
  },
  {
    id: '2',
    title: 'Fashion Brand Ambassador Program',
    description: 'Seeking fashion influencers for our seasonal collection launch. Must have a strong presence in fashion and lifestyle content.',
    budget: 2000,
    category: 'Fashion',
    requirements: 'Fashion-focused content, high engagement rate, professional photography',
    deadline: '2024-04-15',
    status: OrderStatus.OPEN,
    brand: mockUsers[3], // Fashion House
    applications: [
      {
        id: '2',
        message: 'Your brand aesthetic aligns perfectly with my content style. I would love to showcase your collection.',
        proposedPrice: 1800,
        status: 'accepted',
        createdAt: '2024-03-10',
        applicant: mockUsers[1] // Sarah Johnson
      }
    ],
    createdAt: '2024-03-01',
    updatedAt: '2024-03-10'
  },
  {
    id: '3',
    title: 'Food & Travel Content Series',
    description: 'Looking for food and travel influencers to create content about Asian cuisine and culture.',
    budget: 1500,
    category: 'Food & Travel',
    requirements: 'Experience in food content, knowledge of Asian cuisine, travel vlogging skills',
    deadline: '2024-04-30',
    status: OrderStatus.IN_PROGRESS,
    brand: mockUsers[2], // TechBrand Inc
    applications: [
      {
        id: '3',
        message: 'As an Asian food enthusiast and content creator, I would be perfect for this campaign.',
        proposedPrice: 1400,
        status: 'accepted',
        createdAt: '2024-03-05',
        applicant: mockUsers[4] // Mike Chen
      }
    ],
    createdAt: '2024-03-01',
    updatedAt: '2024-03-05'
  },
  {
    id: '4',
    title: 'Luxury Fashion Campaign',
    description: 'High-end fashion brand seeking influencers for our summer collection launch.',
    budget: 3000,
    category: 'Fashion',
    requirements: 'Luxury fashion experience, high-end aesthetic, professional photography',
    deadline: '2024-05-15',
    status: OrderStatus.OPEN,
    brand: mockUsers[3], // Fashion House
    applications: [],
    createdAt: '2024-03-10',
    updatedAt: '2024-03-10'
  },
  {
    id: '5',
    title: 'Tech Tutorial Series',
    description: 'Need tech-savvy influencers to create tutorial content for our software products.',
    budget: 800,
    category: 'Technology',
    requirements: 'Technical knowledge, tutorial creation experience, clear communication skills',
    deadline: '2024-04-01',
    status: OrderStatus.COMPLETED,
    brand: mockUsers[2], // TechBrand Inc
    applications: [
      {
        id: '4',
        message: 'I have created numerous tech tutorials and would love to work on this project.',
        proposedPrice: 750,
        status: 'accepted',
        createdAt: '2024-02-15',
        applicant: mockUsers[0] // John Smith
      }
    ],
    createdAt: '2024-02-01',
    updatedAt: '2024-03-01'
  }
]; 
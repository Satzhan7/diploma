import { Message } from '../types/message';
import { mockUsers } from './users';

export const mockMessages: Message[] = [
  {
    id: '1',
    sender: mockUsers[0], // John Smith
    receiver: mockUsers[2], // TechBrand Inc
    content: 'Hi! I saw your tech product review campaign and I would love to collaborate.',
    createdAt: '2024-03-15T10:00:00Z',
    updatedAt: '2024-03-15T10:00:00Z'
  },
  {
    id: '2',
    sender: mockUsers[2], // TechBrand Inc
    receiver: mockUsers[0], // John Smith
    content: 'Hello! Thank you for your interest. Could you share some examples of your previous tech reviews?',
    createdAt: '2024-03-15T10:05:00Z',
    updatedAt: '2024-03-15T10:05:00Z'
  },
  {
    id: '3',
    sender: mockUsers[0], // John Smith
    receiver: mockUsers[2], // TechBrand Inc
    content: 'Of course! Here are some links to my recent tech reviews: [links]',
    createdAt: '2024-03-15T10:10:00Z',
    updatedAt: '2024-03-15T10:10:00Z'
  },
  {
    id: '4',
    sender: mockUsers[1], // Sarah Johnson
    receiver: mockUsers[3], // Fashion House
    content: 'Hello! I would love to collaborate on your fashion campaign.',
    createdAt: '2024-03-10T14:00:00Z',
    updatedAt: '2024-03-10T14:00:00Z'
  },
  {
    id: '5',
    sender: mockUsers[3], // Fashion House
    receiver: mockUsers[1], // Sarah Johnson
    content: 'Hi Sarah! Your content style is exactly what we\'re looking for. Would you be interested in our summer collection launch?',
    createdAt: '2024-03-10T14:30:00Z',
    updatedAt: '2024-03-10T14:30:00Z'
  },
  {
    id: '6',
    sender: mockUsers[4], // Mike Chen
    receiver: mockUsers[2], // TechBrand Inc
    content: 'Hi! I noticed your food & travel content series. As an Asian food enthusiast, I would love to contribute.',
    createdAt: '2024-03-05T09:00:00Z',
    updatedAt: '2024-03-05T09:00:00Z'
  },
  {
    id: '7',
    sender: mockUsers[2], // TechBrand Inc
    receiver: mockUsers[4], // Mike Chen
    content: 'Hello Mike! Your content looks great. Could you tell us more about your experience with Asian cuisine?',
    createdAt: '2024-03-05T09:15:00Z',
    updatedAt: '2024-03-05T09:15:00Z'
  }
]; 
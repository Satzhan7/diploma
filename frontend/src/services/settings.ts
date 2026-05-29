import api from './api';

export interface UserSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  language: string;
  timezone: string;
}

export const settingsService = {
  get: async (): Promise<UserSettings> => {
    const response = await api.get('/users/settings');
    return response.data;
  },

  update: async (settings: Partial<UserSettings>): Promise<UserSettings> => {
    const response = await api.put('/users/settings', settings);
    return response.data;
  },

  reset: async (): Promise<UserSettings> => {
    const response = await api.post('/users/settings/reset');
    return response.data;
  }
}; 
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.temple.guruseva',
  appName: 'GuruSeva Admin',
  webDir: 'public',
  server: {
    url: 'https://guru-seva.me',
    cleartext: true
  }
};

export default config;

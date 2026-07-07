import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.temple.guruseva',
  appName: 'GuruSeva Admin',
  webDir: 'public',
  server: {
    url: 'https://guruseva.vercel.app', // To be replaced with actual production URL
    cleartext: true
  }
};

export default config;

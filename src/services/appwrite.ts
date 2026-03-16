// ============================================================
// COZY GARDEN — Appwrite Client Configuration
// Backend-as-a-Service for user accounts, databases, and more.
// ============================================================

import { Client, Account, Databases } from 'appwrite';

const client = new Client()
  .setEndpoint('https://nyc.cloud.appwrite.io/v1')
  .setProject('infinity-fg');

const account = new Account(client);
const databases = new Databases(client);

/**
 * Ping the Appwrite backend to verify connectivity.
 * Call this on app startup to ensure the SDK is configured correctly.
 */
export async function pingAppwrite(): Promise<boolean> {
  try {
    await client.ping();
    console.log('✅ Appwrite connection verified');
    return true;
  } catch (error) {
    console.error('❌ Appwrite connection failed:', error);
    return false;
  }
}

export { client, account, databases };

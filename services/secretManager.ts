
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

const client = new SecretManagerServiceClient();
let cachedApiKey: string | null = null;

export async function getPlacesApiKey(): Promise<string> {
  if (cachedApiKey) return cachedApiKey;

  try {
    const [version] = await client.accessSecretVersion({
      name: 'projects/gen-lang-client-0224015230/secrets/maps/versions/latest',
    });

    cachedApiKey = version.payload?.data?.toString() || null;
    console.log('✅ API Key loaded from Secret Manager');
    if (!cachedApiKey) throw new Error("Secret payload is empty");
    return cachedApiKey;
  } catch (error) {
    console.error('❌ Failed to load API key from Secret Manager:', error);
    throw error;
  }
}

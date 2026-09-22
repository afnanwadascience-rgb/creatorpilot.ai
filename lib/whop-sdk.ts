import { WhopClient } from "@whop/sdk";

function getApiKey(): string {
  const key = process.env.WHOP_API_KEY;

  if (!key) {
    throw new Error("WHOP_API_KEY is not set.");
  }

  return key;
}

let cachedClient: WhopClient | null = null;

export function whopApi(): WhopClient {
  if (!cachedClient) {
    cachedClient = new WhopClient({
      token: getApiKey(),
    });
  }

  return cachedClient;
}

export function whopUserClient(accessToken: string): WhopClient {
  return new WhopClient({
    token: accessToken,
  });
}

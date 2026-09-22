import Whop from "@whop/sdk";

let cachedClient: Whop | null = null;

export function whopAppClient(): Whop {
  if (!cachedClient) {
    const apiKey = process.env.WHOP_API_KEY;

    if (!apiKey) {
      throw new Error("WHOP_API_KEY is not configured.");
    }

    cachedClient = new Whop({
      apiKey,
    });
  }

  return cachedClient;
}

export function whopUserClient(accessToken: string): Whop {
  return new Whop({
    apiKey: `Bearer ${accessToken}`,
  });
}

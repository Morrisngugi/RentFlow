import type { ServiceAccount } from 'firebase-admin';

let initialized = false;

function parseServiceAccount(jsonValue: string): ServiceAccount | null {
  try {
    return JSON.parse(jsonValue) as ServiceAccount;
  } catch {
    return null;
  }
}

function getServiceAccount(): ServiceAccount | null {
  const raw = process.env.FCM_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    return null;
  }

  const parsed = parseServiceAccount(raw);
  if (parsed) {
    return parsed;
  }

  try {
    const decoded = Buffer.from(raw, 'base64').toString('utf-8');
    return parseServiceAccount(decoded);
  } catch {
    return null;
  }
}

export async function pushToTokens(
  tokens: string[],
  payload: {
    title: string;
    body: string;
    data?: Record<string, string>;
  }
): Promise<{ invalidTokens: string[] }> {
  if (tokens.length === 0) {
    return { invalidTokens: [] };
  }

  if (process.env.FCM_ENABLED === 'false') {
    return { invalidTokens: [] };
  }

  const serviceAccount = getServiceAccount();
  if (!serviceAccount) {
    return { invalidTokens: [] };
  }

  const admin = await import('firebase-admin');

  if (!initialized) {
    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }
    initialized = true;
  }

  const response = await admin.messaging().sendEachForMulticast({
    tokens,
    notification: {
      title: payload.title,
      body: payload.body,
    },
    data: payload.data,
    android: {
      priority: 'high',
    },
  });

  const invalidTokens: string[] = [];
  response.responses.forEach((result, index) => {
    if (!result.success) {
      const code = result.error?.code || '';
      if (
        code.includes('registration-token-not-registered') ||
        code.includes('invalid-registration-token')
      ) {
        invalidTokens.push(tokens[index]);
      }
    }
  });

  return { invalidTokens };
}

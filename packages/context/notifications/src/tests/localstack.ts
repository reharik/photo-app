export const LOCALSTACK_ENDPOINT = process.env.AWS_ENDPOINT?.trim() || 'http://localhost:4566';

export const isLocalStackAvailable = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${LOCALSTACK_ENDPOINT}/_localstack/health`);
    if (!response.ok) {
      return false;
    }
    const health = (await response.json()) as { services?: { ses?: string } };
    return health.services?.ses === 'running' || health.services?.ses === 'available';
  } catch {
    return false;
  }
};

export const retrieveLocalStackSesMessages = async (): Promise<unknown> => {
  const response = await fetch(`${LOCALSTACK_ENDPOINT}/_aws/ses`);
  if (!response.ok) {
    throw new Error(`Failed to retrieve SES messages: ${response.status} ${response.statusText}`);
  }
  return response.json();
};

import { HttpError } from './HttpError';

export function parseUserInput(body: unknown): {
  name: string;
  email: string;
  password: string;
} {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    throw new HttpError(400, 'Request body must be a JSON object.');
  }

  const { name, email, password } = body as Record<string, unknown>;

  if (typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
    throw new HttpError(400, 'Name, email, and password are required as strings.');
  }

  const normalizedName = name.trim();
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedName || !normalizedEmail || password.length < 8) {
    throw new HttpError(400, 'Name, email, and password must be valid.');
  }

  return {
    name: normalizedName,
    email: normalizedEmail,
    password,
  };
}

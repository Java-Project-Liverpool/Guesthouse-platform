import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import { HttpError } from '../utils/HttpError';
import { parseUserInput } from '../utils/validate';

export async function createAdmin(req: Request, res: Response) {
  const { name, email, password } = parseUserInput(req.body);

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new HttpError(409, 'Email already in use');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email,
    passwordHash,
    role: 'admin',
    authProvider: 'local',
  });

  res.status(201).json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  });
}

export async function listAdmins(_req: Request, res: Response) {
  const admins = await User.find({ role: 'admin' }).sort({ createdAt: -1 });

  res.json(
    admins.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    }))
  );
}

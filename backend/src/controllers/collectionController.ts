import type { Request, Response } from 'express';

export async function listCollections(_req: Request, res: Response) {
  res.status(501).json({ message: 'Collections are not implemented yet.' });
}

export async function createCollection(_req: Request, res: Response) {
  res.status(501).json({ message: 'Collections are not implemented yet.' });
}

export async function getCollection(_req: Request, res: Response) {
  res.status(501).json({ message: 'Collections are not implemented yet.' });
}

export async function renameCollection(_req: Request, res: Response) {
  res.status(501).json({ message: 'Collections are not implemented yet.' });
}

export async function deleteCollection(_req: Request, res: Response) {
  res.status(501).json({ message: 'Collections are not implemented yet.' });
}

export async function addGuesthouseToCollection(_req: Request, res: Response) {
  res.status(501).json({ message: 'Collections are not implemented yet.' });
}

export async function removeGuesthouseFromCollection(_req: Request, res: Response) {
  res.status(501).json({ message: 'Collections are not implemented yet.' });
}

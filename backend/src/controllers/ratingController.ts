import type { Request, Response } from 'express';

export async function listMyRatings(_req: Request, res: Response) {
  res.status(501).json({ message: 'Ratings are not implemented yet.' });
}

export async function createRating(_req: Request, res: Response) {
  res.status(501).json({ message: 'Ratings are not implemented yet.' });
}

export async function updateRating(_req: Request, res: Response) {
  res.status(501).json({ message: 'Ratings are not implemented yet.' });
}

export async function deleteRating(_req: Request, res: Response) {
  res.status(501).json({ message: 'Ratings are not implemented yet.' });
}

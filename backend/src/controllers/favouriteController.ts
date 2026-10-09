import type { Request, Response } from 'express';

export async function listFavourites(_req: Request, res: Response) {
  res.status(501).json({ message: 'Favourites are not implemented yet.' });
}

export async function addFavourite(_req: Request, res: Response) {
  res.status(501).json({ message: 'Favourites are not implemented yet.' });
}

export async function removeFavourite(_req: Request, res: Response) {
  res.status(501).json({ message: 'Favourites are not implemented yet.' });
}

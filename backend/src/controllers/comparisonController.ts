import type { Request, Response } from 'express';

export async function listComparisons(_req: Request, res: Response) {
  res.status(501).json({ message: 'Comparisons are not implemented yet.' });
}

export async function createComparison(_req: Request, res: Response) {
  res.status(501).json({ message: 'Comparisons are not implemented yet.' });
}

export async function getComparison(_req: Request, res: Response) {
  res.status(501).json({ message: 'Comparisons are not implemented yet.' });
}

export async function deleteComparison(_req: Request, res: Response) {
  res.status(501).json({ message: 'Comparisons are not implemented yet.' });
}

export async function addGuesthouseToComparison(_req: Request, res: Response) {
  res.status(501).json({ message: 'Comparisons are not implemented yet.' });
}

export async function removeGuesthouseFromComparison(_req: Request, res: Response) {
  res.status(501).json({ message: 'Comparisons are not implemented yet.' });
}

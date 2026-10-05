import { Request, Response } from 'express';
import * as schedulesService from './schedules.service';

export async function list(req: Request, res: Response): Promise<void> {
  const dayOfWeek = req.query.dayOfWeek !== undefined ? Number(req.query.dayOfWeek) : undefined;
  const active = req.query.active !== undefined ? req.query.active === 'true' : undefined;
  const slots = await schedulesService.listSlots({ dayOfWeek, active });
  res.json(slots);
}

export async function getById(req: Request, res: Response): Promise<void> {
  const slot = await schedulesService.getSlotById(req.params.id as string);
  res.json(slot);
}

export async function create(req: Request, res: Response): Promise<void> {
  const slot = await schedulesService.createSlot(req.body);
  res.status(201).json(slot);
}

export async function update(req: Request, res: Response): Promise<void> {
  const slot = await schedulesService.updateSlot(req.params.id as string, req.body);
  res.json(slot);
}

export async function toggle(req: Request, res: Response): Promise<void> {
  const { active } = req.body;
  if (typeof active !== 'boolean') {
    res.status(400).json({ error: 'Campo "active" deve ser boolean.' });
    return;
  }
  const slot = await schedulesService.toggleSlotActive(req.params.id as string, active);
  res.json(slot);
}

export async function getAvailable(req: Request, res: Response): Promise<void> {
  const { date } = req.query;
  if (!date || typeof date !== 'string') {
    res.status(400).json({ error: 'Parâmetro "date" é obrigatório (YYYY-MM-DD).' });
    return;
  }
  const slots = await schedulesService.getAvailableSlots(date);
  res.json(slots);
}

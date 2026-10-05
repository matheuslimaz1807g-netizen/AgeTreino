import { Request, Response } from 'express';
import * as appointmentsService from './appointments.service';

export async function create(req: Request, res: Response): Promise<void> {
  if (!req.usuario) {
    res.status(401).json({ error: 'Usuário não autenticado.' });
    return;
  }
  
  const userId = req.usuario.sub;
  const appointment = await appointmentsService.createAppointment({
    userId,
    slotId: req.body.slotId,
    date: req.body.date,
  });
  res.status(201).json(appointment);
}

export async function list(req: Request, res: Response): Promise<void> {
  if (!req.usuario) {
    res.status(401).json({ error: 'Usuário não autenticado.' });
    return;
  }
  
  const isAdmin = req.usuario.role === 'admin';
  const filters = {
    userId: isAdmin ? (req.query.userId as string | undefined) : req.usuario.sub,
    slotId: req.query.slotId as string | undefined,
    date: req.query.date as string | undefined,
    status: req.query.status as string | undefined,
    page: req.query.page ? Number(req.query.page) : 1,
    limit: req.query.limit ? Number(req.query.limit) : 20,
  };
  const result = await appointmentsService.listAppointments(filters);
  res.json(result);
}

export async function getById(req: Request, res: Response): Promise<void> {
  if (!req.usuario) {
    res.status(401).json({ error: 'Usuário não autenticado.' });
    return;
  }
  
  const appointment = await appointmentsService.getAppointmentById(
    req.params.id as string,
    req.usuario.sub,
    req.usuario.role
  );
  res.json(appointment);
}

export async function cancel(req: Request, res: Response): Promise<void> {
  if (!req.usuario) {
    res.status(401).json({ error: 'Usuário não autenticado.' });
    return;
  }
  
  const appointment = await appointmentsService.cancelAppointment(
    req.params.id as string,
    req.usuario.sub,
    req.usuario.role,
    req.body.reason
  );
  res.json(appointment);
}

export async function adminBook(req: Request, res: Response): Promise<void> {
  const appointment = await appointmentsService.adminBook({
    slotId: req.body.slotId,
    date: req.body.date,
    guestName: req.body.guestName,
  });
  res.status(201).json(appointment);
}

export async function confirm(req: Request, res: Response): Promise<void> {
  const appointment = await appointmentsService.confirmAppointment(req.params.id as string);
  res.json(appointment);
}

export async function occupancy(req: Request, res: Response): Promise<void> {
  const { slotId, date } = req.query;
  const result = await appointmentsService.getSlotOccupancy(
    slotId as string,
    date as string
  );
  res.json(result);
}

import { Request, Response } from 'express';
import * as notificationsService from './notifications.service';

export async function list(req: Request, res: Response): Promise<void> {
  if (!req.usuario) {
    res.status(401).json({ error: 'Usuário não autenticado.' });
    return;
  }
  
  const userId = req.usuario.sub;
  const page = req.query.page ? Number(req.query.page) : 1;
  const result = await notificationsService.listNotifications(userId, page);
  res.json(result);
}

export async function unreadCount(req: Request, res: Response): Promise<void> {
  if (!req.usuario) {
    res.status(401).json({ error: 'Usuário não autenticado.' });
    return;
  }
  
  const count = await notificationsService.getUnreadCount(req.usuario.sub);
  res.json({ count });
}

export async function markRead(req: Request, res: Response): Promise<void> {
  if (!req.usuario) {
    res.status(401).json({ error: 'Usuário não autenticado.' });
    return;
  }
  
  await notificationsService.markAsRead(req.params.id as string, req.usuario.sub);
  res.json({ ok: true });
}

export async function markAllRead(req: Request, res: Response): Promise<void> {
  if (!req.usuario) {
    res.status(401).json({ error: 'Usuário não autenticado.' });
    return;
  }
  
  await notificationsService.markAllAsRead(req.usuario.sub);
  res.json({ ok: true });
}

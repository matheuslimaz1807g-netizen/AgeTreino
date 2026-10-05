import { Request, Response } from 'express';
import * as studentsService from './students.service';

export async function create(req: Request, res: Response): Promise<void> {
  const student = await studentsService.createStudent(req.body);
  res.status(201).json(student);
}

export async function list(req: Request, res: Response): Promise<void> {
  const activeRaw = req.query.active;
  const active = activeRaw !== undefined ? String(activeRaw) === 'true' : undefined;
  const search = req.query.search ? String(req.query.search) : undefined;
  const students = await studentsService.listStudents({ active, search });
  res.json(students);
}

export async function getById(req: Request, res: Response): Promise<void> {
  const student = await studentsService.getStudentById(String(req.params.id));
  res.json(student);
}

export async function update(req: Request, res: Response): Promise<void> {
  const student = await studentsService.updateStudent(String(req.params.id), req.body);
  res.json(student);
}

export async function remove(req: Request, res: Response): Promise<void> {
  await studentsService.deleteStudent(String(req.params.id));
  res.status(204).send();
}

export async function setSchedules(req: Request, res: Response): Promise<void> {
  const { horarios } = req.body;
  if (!Array.isArray(horarios)) {
    res.status(400).json({ error: 'Campo "horarios" deve ser um array.' });
    return;
  }
  const student = await studentsService.setStudentSchedules(String(req.params.id), horarios);
  res.json(student);
}

export async function syncSchedule(req: Request, res: Response): Promise<void> {
  const result = await studentsService.syncStudentSchedule(String(req.params.id));
  res.json(result);
}

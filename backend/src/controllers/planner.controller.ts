import type { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler";
import { plannerService } from "../services/planner.service";
import { AppError } from "../utils/AppError";

const requireUser = (req: Request) => {
  if (!req.user) throw new AppError("Authentication required", 401, "UNAUTHENTICATED");
  return req.user;
};

export const plannerController = {
  listTasks: asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    const tasks = await plannerService.listTasks(user.id, req.query as { date?: string; from?: string; to?: string });
    res.json({ success: true, data: { tasks } });
  }),

  createTask: asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    const task = await plannerService.createTask(user.id, req.body);
    res.status(201).json({ success: true, data: { task } });
  }),

  updateTask: asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    const task = await plannerService.updateTask(user.id, String(req.params.id), req.body);
    res.json({ success: true, data: { task } });
  }),

  removeTask: asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    await plannerService.removeTask(user.id, String(req.params.id));
    res.status(204).send();
  }),

  listNotes: asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    const notes = await plannerService.listNotes(user.id, req.query as { from?: string; to?: string });
    res.json({ success: true, data: { notes } });
  }),

  createNote: asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    const note = await plannerService.createNote(user.id, req.body);
    res.status(201).json({ success: true, data: { note } });
  }),

  updateNote: asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    const note = await plannerService.updateNote(user.id, String(req.params.id), req.body);
    res.json({ success: true, data: { note } });
  }),

  removeNote: asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    await plannerService.removeNote(user.id, String(req.params.id));
    res.status(204).send();
  }),

  listTime: asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    res.json({
      success: true,
      data: await plannerService.listTime(user.id, req.query as { from?: string; to?: string }),
    });
  }),

  setTimeCell: asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    const entry = await plannerService.setTimeCell(user.id, req.body);
    res.json({ success: true, data: { entry } });
  }),
};

import type { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler";
import { contactService } from "../services/contact.service";

export const contactController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const message = await contactService.create(req.body);
    res.status(201).json({
      success: true,
      data: { message, info: "Your message was received. We reply within 1-2 business days." },
    });
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const status = req.query.status as "new" | "read" | "replied" | undefined;
    res.json({ success: true, data: { messages: await contactService.adminList(status) } });
  }),

  updateStatus: asyncHandler(async (req: Request, res: Response) => {
    const message = await contactService.setStatus(String(req.params.id), req.body.status);
    res.json({ success: true, data: { message } });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await contactService.remove(String(req.params.id));
    res.status(204).send();
  }),
};

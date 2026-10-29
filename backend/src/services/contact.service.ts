import { ContactMessage, type ContactStatus, type IContactMessage } from "../models/ContactMessage";
import { env } from "../config/env";
import { AppError } from "../utils/AppError";
import { emailService } from "./email.service";

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const format = (row: IContactMessage) => ({
  id: row.id,
  name: row.name,
  email: row.email,
  topic: row.topic,
  subject: row.subject || "",
  message: row.message,
  status: row.status,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

export const contactService = {
  async create(input: {
    name: string;
    email: string;
    topic: "general" | "billing" | "bug" | "feature" | "press" | "careers";
    subject?: string;
    message: string;
  }, userId?: string) {
    const row = await ContactMessage.create({ ...input, userId });

    const inbox = env.contactInbox || env.supportEmail;
    if (inbox) {
      void emailService.sendMail(
        inbox,
        `[${input.topic}] ${input.subject || `Message from ${input.name}`}`,
        `<p><strong>${escapeHtml(input.name)}</strong> &lt;${escapeHtml(input.email)}&gt;</p>
         <p>${escapeHtml(input.message).replace(/\n/g, "<br/>")}</p>
         <hr/><p>Reply directly to this email to answer the user.</p>`,
        input.email
      );
    }

    return format(row);
  },

  async adminList(status?: ContactStatus) {
    const filter = status ? { status } : {};
    const rows = await ContactMessage.find(filter).sort({ createdAt: -1 }).limit(500);
    return rows.map(format);
  },

  async setStatus(id: string, status: ContactStatus) {
    const row = await ContactMessage.findByIdAndUpdate(id, { $set: { status } }, { new: true });
    if (!row) throw new AppError("Message not found", 404, "MESSAGE_NOT_FOUND");
    return format(row);
  },

  async remove(id: string) {
    const row = await ContactMessage.findByIdAndDelete(id);
    if (!row) throw new AppError("Message not found", 404, "MESSAGE_NOT_FOUND");
  },
};

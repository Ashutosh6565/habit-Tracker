import mongoose, { Document, Schema, Types } from "mongoose";

export type TemplateUnlockTier = "free" | "starter" | "premium";

export interface TemplateCatalogHabit {
  habitId: string;
  name: string;
  icon: string;
}

export interface ITemplateCatalog extends Document<Types.ObjectId> {
  templateId: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  month: string;
  year: number;
  totalDays: number;
  habits: TemplateCatalogHabit[];
  unlockTier: TemplateUnlockTier;
  isActive: boolean;
  sortOrder: number;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const templateCatalogSchema = new Schema<ITemplateCatalog>(
  {
    templateId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    icon: {
      type: String,
      default: "Check",
      trim: true,
      maxlength: 40,
    },
    color: {
      type: String,
      default: "gradient-primary",
      trim: true,
      maxlength: 80,
    },
    month: {
      type: String,
      default: "January",
      trim: true,
      maxlength: 20,
    },
    year: {
      type: Number,
      default: 2026,
      min: 2024,
      max: 2100,
    },
    totalDays: {
      type: Number,
      required: true,
      min: 1,
      max: 366,
    },
    habits: [
      {
        habitId: { type: String, required: true, trim: true, maxlength: 120 },
        name: { type: String, required: true, trim: true, maxlength: 140 },
        icon: { type: String, default: "✓", trim: true, maxlength: 16 },
      },
    ],
    unlockTier: {
      type: String,
      enum: ["free", "starter", "premium"],
      default: "premium",
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

templateCatalogSchema.index({ isActive: 1, unlockTier: 1, sortOrder: 1 });
templateCatalogSchema.index({ name: "text", description: "text" });

export const TemplateCatalog = mongoose.model<ITemplateCatalog>(
  "TemplateCatalog",
  templateCatalogSchema
);

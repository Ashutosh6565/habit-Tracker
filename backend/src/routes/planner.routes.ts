import { Router } from "express";
import { plannerController } from "../controllers/planner.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate";
import {
  createNoteSchema,
  createTaskSchema,
  noteIdParamSchema,
  noteListQuerySchema,
  taskIdParamSchema,
  taskListQuerySchema,
  timeCellSchema,
  timeQuerySchema,
  updateNoteSchema,
  updateTaskSchema,
} from "../validators/planner.validator";

export const plannerRouter = Router();

plannerRouter.use(authenticate);

plannerRouter.get("/tasks", validate({ query: taskListQuerySchema }), plannerController.listTasks);
plannerRouter.post("/tasks", validate({ body: createTaskSchema }), plannerController.createTask);
plannerRouter.patch(
  "/tasks/:id",
  validate({ params: taskIdParamSchema, body: updateTaskSchema }),
  plannerController.updateTask
);
plannerRouter.delete("/tasks/:id", validate({ params: taskIdParamSchema }), plannerController.removeTask);

plannerRouter.get("/notes", validate({ query: noteListQuerySchema }), plannerController.listNotes);
plannerRouter.post("/notes", validate({ body: createNoteSchema }), plannerController.createNote);
plannerRouter.patch(
  "/notes/:id",
  validate({ params: noteIdParamSchema, body: updateNoteSchema }),
  plannerController.updateNote
);
plannerRouter.delete("/notes/:id", validate({ params: noteIdParamSchema }), plannerController.removeNote);

plannerRouter.get("/time", validate({ query: timeQuerySchema }), plannerController.listTime);
plannerRouter.put("/time", validate({ body: timeCellSchema }), plannerController.setTimeCell);

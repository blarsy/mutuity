import type { TaskList } from "graphile-worker";
import { expireNeedsTask } from "./tasks/expire-needs.js";

export const taskList: TaskList = {
  expire_needs: expireNeedsTask
};

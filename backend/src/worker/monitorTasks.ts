import type { TaskList } from "graphile-worker";
import { captureUnexpectedError } from "../monitoring/instrument.js";

export function monitorTasks(tasks: TaskList): TaskList {
  return Object.fromEntries(Object.entries(tasks).filter((entry): entry is [string, NonNullable<TaskList[string]>] => Boolean(entry[1])).map(([name, task]) => [name, async (payload, helpers) => {
    try {
      return await task(payload, helpers);
    } catch (error) {
      // Do not attach payload, job metadata, recipient IDs, or helpers.
      captureUnexpectedError(error);
      throw error; // Preserve Graphile retry and existing worker logging.
    }
  }])) as TaskList;
}
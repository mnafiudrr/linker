export type ActionError = { ok: false; message: string };

export type ActionSuccess<T> = { ok: true; data: T };

export type ActionResult<T> = ActionSuccess<T> | ActionError;

import { ZodError } from "zod";

export function actionError(message: string): ActionError {
  return { ok: false, message };
}

export function actionSuccess<T>(data: T): ActionSuccess<T> {
  return { ok: true, data };
}

/**
 * Runs a mutation body and normalizes its result or thrown domain errors
 * into a serializable ActionResult for client consumption.
 */
export async function runAction<T>(body: () => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  try {
    return await body();
  } catch (error) {
    if (error instanceof ZodError) {
      return actionError(error.issues[0]?.message ?? "Invalid input.");
    }
    throw error;
  }
}

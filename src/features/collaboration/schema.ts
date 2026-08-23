import { z } from "zod";

export const inviteCollaboratorInput = z.object({
  folderId: z.uuid(),
  email: z.email(),
  role: z.enum(["editor", "viewer"]),
});

export const respondToInvitationInput = z.object({
  id: z.uuid(),
  accept: z.boolean(),
});

export const removeCollaboratorInput = z.object({
  id: z.uuid(),
});

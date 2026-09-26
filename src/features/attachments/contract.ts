import { z } from 'zod';

export const ATTACHMENT_MAX_FILE_SIZE = 10 * 1024 * 1024;
export const ATTACHMENT_EXTENSIONS = ['pdf', 'doc', 'docx', 'xlsx', 'csv', 'pptx', 'zip'] as const;

export const attachmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  size: z.number(),
});

export type Attachment = z.infer<typeof attachmentSchema>;

export interface AttachmentSuccess<T = undefined> {
  success: true;
  message: string;
  data: T;
}

export interface AttachmentError {
  success: false;
  message: string;
  code: string;
}

export type AttachmentUploadResponse = AttachmentSuccess<{ attachment: Attachment }> | AttachmentError;

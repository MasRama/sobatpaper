import { csrfHeaders, ensureCsrfToken } from '../../auth/web';
import type { AttachmentUploadResponse } from '../contract';

export interface AttachmentsClient {
  upload(file: File): Promise<AttachmentUploadResponse>;
}

export function createAttachmentsClient(baseUrl = '/api/attachments'): AttachmentsClient {
  const root = baseUrl.replace(/\/$/, '');
  return {
    upload: async (file) => {
      await ensureCsrfToken();
      const form = new FormData();
      form.set('file', file);
      const response = await fetch(`${root}/`, {
        method: 'POST',
        credentials: 'include',
        headers: { ...csrfHeaders() },
        body: form,
      });
      return (await response.json()) as AttachmentUploadResponse;
    },
  };
}

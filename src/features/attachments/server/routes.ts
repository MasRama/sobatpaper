import { Buffer } from 'node:buffer';
import { getCookie } from 'hono/cookie';
import { Hono } from 'hono';
import { getCurrentUser, isAdmin, SESSION_COOKIE_NAME } from '../../auth';
import { createAttachmentRow, findAttachmentById } from './repository';
import {
  contentMatchesExtension,
  readStoredUpload,
  safeOriginalName,
  storeValidatedUpload,
  validateUpload,
} from './storage';

const MIME_BY_EXTENSION: Record<string, string> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  csv: 'text/csv',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  zip: 'application/zip',
};

export const attachmentsRoutes = new Hono()
  .post('/', async (context) => {
    const body = await context.req.parseBody();
    const validated = validateUpload(body.file);
    if ('code' in validated) {
      const status = validated.code === 'FILE_TOO_LARGE' ? 413 : 422;
      const message =
        validated.code === 'FILE_REQUIRED'
          ? 'A file is required'
          : validated.code === 'FILE_TOO_LARGE'
            ? 'File exceeds the 10 MB limit'
            : 'File type not allowed. Use PDF, DOC, DOCX, XLSX, CSV, PPTX, or ZIP';
      return context.json({ success: false as const, message, code: validated.code }, status);
    }
    const bytes = new Uint8Array(await validated.file.arrayBuffer());
    if (!contentMatchesExtension(bytes, validated.extension)) {
      return context.json(
        { success: false as const, message: 'File content does not match its extension', code: 'FILE_CONTENT_MISMATCH' },
        422,
      );
    }
    const storedName = storeValidatedUpload(validated.extension, bytes);
    const row = createAttachmentRow({
      originalName: validated.name,
      storedName,
      mimeType: MIME_BY_EXTENSION[validated.extension] ?? 'application/octet-stream',
      size: bytes.length,
    });
    return context.json(
      {
        success: true as const,
        message: 'File uploaded',
        data: { attachment: { id: row.id, name: row.original_name, size: row.size } },
      },
      201,
    );
  })
  .get('/:id', (context) => {
    const sessionUser = getCurrentUser(getCookie(context, SESSION_COOKIE_NAME));
    if (!sessionUser) {
      return context.json({ success: false as const, message: 'Unauthorized', code: 'UNAUTHORIZED' }, 401);
    }
    if (!isAdmin(sessionUser.id)) {
      return context.json({ success: false as const, message: 'Forbidden', code: 'FORBIDDEN' }, 403);
    }
    const row = findAttachmentById(context.req.param('id'));
    const bytes = row ? readStoredUpload(row.stored_name) : undefined;
    if (!row || !bytes) {
      return context.json({ success: false as const, message: 'Attachment not found', code: 'NOT_FOUND' }, 404);
    }
    return new Response(Buffer.from(bytes), {
      status: 200,
      headers: {
        'Content-Type': row.mime_type,
        'Content-Disposition': `attachment; filename="${safeOriginalName(row.original_name)}"`,
        'Cache-Control': 'no-store',
      },
    });
  });

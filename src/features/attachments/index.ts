export { attachmentsRoutes } from './server/routes';
export { linkAttachmentsToOrder, listAttachmentsByOrder } from './server/repository';
export { ATTACHMENT_EXTENSIONS, ATTACHMENT_MAX_FILE_SIZE, attachmentSchema } from './contract';
export type { Attachment, AttachmentError, AttachmentSuccess, AttachmentUploadResponse } from './contract';

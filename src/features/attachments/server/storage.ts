import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ATTACHMENT_EXTENSIONS, ATTACHMENT_MAX_FILE_SIZE } from '../contract';

const ZIP_MAGIC = [0x50, 0x4b];
const PDF_MAGIC = [0x25, 0x50, 0x44, 0x46];
const OLE_MAGIC = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1];

function startsWith(bytes: Uint8Array, magic: number[]): boolean {
  return magic.every((byte, index) => bytes[index] === byte);
}

function looksTextual(bytes: Uint8Array): boolean {
  return !bytes.slice(0, 512).includes(0);
}

export function extensionOf(filename: string): string {
  const base = filename.split(/[\\/]/).pop() ?? filename;
  const dot = base.lastIndexOf('.');
  return dot >= 0 ? base.slice(dot + 1).toLowerCase() : '';
}

export function contentMatchesExtension(bytes: Uint8Array, extension: string): boolean {
  switch (extension) {
    case 'pdf':
      return startsWith(bytes, PDF_MAGIC);
    case 'zip':
    case 'docx':
    case 'xlsx':
    case 'pptx':
      return startsWith(bytes, ZIP_MAGIC);
    case 'doc':
      return startsWith(bytes, OLE_MAGIC);
    case 'csv':
      return bytes.length > 0 && looksTextual(bytes);
    default:
      return false;
  }
}

export type AttachmentRejection = { code: 'FILE_REQUIRED' } | { code: 'FILE_TOO_LARGE' } | { code: 'FILE_TYPE_NOT_ALLOWED' };

export function storageDirectory(): string {
  const directory = join(process.cwd(), 'storage', 'order-attachments');
  if (!existsSync(directory)) mkdirSync(directory, { recursive: true });
  return directory;
}

export interface UploadedFile {
  readonly name: string;
  readonly size: number;
  readonly type: string;
  arrayBuffer(): Promise<ArrayBuffer>;
}

const EXTENSION_BY_MIME: Record<string, string> = {
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'text/csv': 'csv',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'application/zip': 'zip',
};

function asUploadedFile(file: unknown): UploadedFile | undefined {
  if (typeof file !== 'object' || file === null) return undefined;
  const candidate = file as Record<string, unknown>;
  if (
    typeof candidate.name !== 'string' ||
    typeof candidate.size !== 'number' ||
    typeof candidate.arrayBuffer !== 'function'
  ) {
    return undefined;
  }
  return {
    name: candidate.name,
    size: candidate.size,
    type: typeof candidate.type === 'string' ? candidate.type : '',
    arrayBuffer: (candidate.arrayBuffer as () => Promise<ArrayBuffer>).bind(file),
  };
}

export function validateUpload(file: unknown): { name: string; extension: string; file: UploadedFile } | AttachmentRejection {
  const uploaded = asUploadedFile(file);
  if (!uploaded) return { code: 'FILE_REQUIRED' };
  if (uploaded.size === 0 || uploaded.size > ATTACHMENT_MAX_FILE_SIZE) return { code: 'FILE_TOO_LARGE' };
  const allowed = ATTACHMENT_EXTENSIONS as readonly string[];
  const fromName = extensionOf(uploaded.name);
  const extension = allowed.includes(fromName) ? fromName : (EXTENSION_BY_MIME[uploaded.type] ?? '');
  if (!allowed.includes(extension)) return { code: 'FILE_TYPE_NOT_ALLOWED' };
  return { name: uploaded.name, extension, file: uploaded };
}

export function storeValidatedUpload(extension: string, bytes: Uint8Array): string {
  const storedName = `${randomUUID()}.${extension}`;
  writeFileSync(join(storageDirectory(), storedName), bytes);
  return storedName;
}

export function readStoredUpload(storedName: string): Uint8Array | undefined {
  if (storedName.includes('/') || storedName.includes('\\') || storedName.includes('..')) return undefined;
  const path = join(storageDirectory(), storedName);
  if (!existsSync(path)) return undefined;
  return new Uint8Array(readFileSync(path));
}

export function safeOriginalName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? 'upload';
  return base.replace(/["\r\n]/g, '').slice(0, 200) || 'upload';
}

import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';

export const UPLOADS_ROOT = path.resolve(process.cwd(), 'uploads');
export const COVERS_DIR = path.join(UPLOADS_ROOT, 'covers');
export const AUDIO_DIR = path.join(UPLOADS_ROOT, 'audio');

function ensureDirs(): void {
  for (const dir of [UPLOADS_ROOT, COVERS_DIR, AUDIO_DIR]) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

ensureDirs();

function uniqueName(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase() || '';
  return `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
}

const coverStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, COVERS_DIR),
  filename: (_req, file, cb) => cb(null, uniqueName(file.originalname)),
});

const audioStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, AUDIO_DIR),
  filename: (_req, file, cb) => cb(null, uniqueName(file.originalname)),
});

const imageMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/jpg']);
const audioMimeTypes = new Set([
  'audio/mpeg',
  'audio/mp3',
  'audio/mp4',
  'audio/x-m4a',
  'audio/m4a',
  'audio/wav',
  'audio/x-wav',
  'audio/wave',
  'audio/webm',
]);

export const uploadCover = multer({
  storage: coverStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!imageMimeTypes.has(file.mimetype)) {
      cb(new AppError('Cover must be a JPEG, PNG, or WebP image', 400));
      return;
    }
    cb(null, true);
  },
});

export const uploadAudio = multer({
  storage: audioStorage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!audioMimeTypes.has(file.mimetype)) {
      cb(new AppError('Chapter audio must be MP3, M4A, WAV, or similar', 400));
      return;
    }
    cb(null, true);
  },
});

export function toPublicUrl(relativePath: string): string {
  const normalized = relativePath.replace(/\\/g, '/').replace(/^\//, '');
  return `/uploads/${normalized.replace(/^uploads\//, '')}`;
}

export function coverPublicPath(filename: string): string {
  return toPublicUrl(`covers/${filename}`);
}

export function audioPublicPath(filename: string): string {
  return toPublicUrl(`audio/${filename}`);
}

export function absoluteMediaUrl(publicPath?: string | null): string | undefined {
  if (!publicPath) {
    return undefined;
  }

  if (/^https?:\/\//i.test(publicPath)) {
    return publicPath;
  }

  const base = env.PUBLIC_BASE_URL.replace(/\/$/, '');
  const pathPart = publicPath.startsWith('/') ? publicPath : `/${publicPath}`;
  return `${base}${pathPart}`;
}

export function deleteUploadedFile(publicPath?: string | null): void {
  if (!publicPath || /^https?:\/\//i.test(publicPath)) {
    return;
  }

  const relative = publicPath.replace(/^\/uploads\//, '');
  const absolute = path.join(UPLOADS_ROOT, relative);

  if (fs.existsSync(absolute)) {
    fs.unlinkSync(absolute);
  }
}

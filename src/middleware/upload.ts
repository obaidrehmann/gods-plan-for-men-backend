import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { AppError } from '../utils/AppError';

export const UPLOADS_ROOT = path.resolve(process.cwd(), 'uploads');
export const COVERS_DIR = path.join(UPLOADS_ROOT, 'covers');
export const AUDIO_DIR = path.join(UPLOADS_ROOT, 'audio');
export const CHAPTERS_DIR = path.join(UPLOADS_ROOT, 'chapters');
export const PDF_DIR = path.join(UPLOADS_ROOT, 'pdfs');
export const AVATARS_DIR = path.join(UPLOADS_ROOT, 'avatars');

function ensureDirs(): void {
  for (const dir of [UPLOADS_ROOT, COVERS_DIR, AUDIO_DIR, CHAPTERS_DIR, PDF_DIR, AVATARS_DIR]) {
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

const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, AVATARS_DIR),
  filename: (_req, file, cb) => cb(null, uniqueName(file.originalname)),
});

const pdfStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, PDF_DIR),
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
const pdfMimeTypes = new Set(['application/pdf']);

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

const chapterMediaStorage = multer.diskStorage({
  destination: (_req, file, cb) => {
    if (file.fieldname === 'image') {
      cb(null, CHAPTERS_DIR);
      return;
    }
    cb(null, AUDIO_DIR);
  },
  filename: (_req, file, cb) => cb(null, uniqueName(file.originalname)),
});

export const uploadChapterMedia = multer({
  storage: chapterMediaStorage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.fieldname === 'image') {
      if (!imageMimeTypes.has(file.mimetype)) {
        cb(new AppError('Chapter image must be a JPEG, PNG, or WebP image', 400));
        return;
      }
      cb(null, true);
      return;
    }

    if (file.fieldname === 'audio') {
      if (!audioMimeTypes.has(file.mimetype)) {
        cb(new AppError('Chapter audio must be MP3, M4A, WAV, or similar', 400));
        return;
      }
      cb(null, true);
      return;
    }

    cb(new AppError('Unexpected file field', 400));
  },
});

export const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!imageMimeTypes.has(file.mimetype)) {
      cb(new AppError('Avatar must be a JPEG, PNG, or WebP image', 400));
      return;
    }
    cb(null, true);
  },
});

export const uploadPdf = multer({
  storage: pdfStorage,
  limits: { fileSize: 40 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!pdfMimeTypes.has(file.mimetype)) {
      cb(new AppError('Book file must be a PDF', 400));
      return;
    }
    cb(null, true);
  },
});

/**
 * Normalize any media reference to a host-free path for DB storage / API responses.
 * Examples:
 *   covers/a.png
 *   /uploads/covers/a.png
 *   http://localhost:3000/uploads/covers/a.png
 * → "/uploads/covers/a.png"
 */
export function toStoredMediaPath(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  let pathPart = value.trim();

  if (/^https?:\/\//i.test(pathPart)) {
    try {
      pathPart = new URL(pathPart).pathname;
    } catch {
      return null;
    }
  }

  pathPart = pathPart.replace(/\\/g, '/');
  if (!pathPart.startsWith('/')) {
    pathPart = `/${pathPart}`;
  }

  pathPart = pathPart.replace(/^\/uploads\//, '/').replace(/^\//, '');
  if (!pathPart) {
    return null;
  }

  return `/uploads/${pathPart}`;
}

/** Build a relative public path to store in MongoDB (never a full URL). */
export function coverPublicPath(filename: string): string {
  return toStoredMediaPath(`covers/${filename}`) as string;
}

export function audioPublicPath(filename: string): string {
  return toStoredMediaPath(`audio/${filename}`) as string;
}

export function chapterImagePublicPath(filename: string): string {
  return toStoredMediaPath(`chapters/${filename}`) as string;
}

export function pdfPublicPath(filename: string): string {
  return toStoredMediaPath(`pdfs/${filename}`) as string;
}

export function avatarPublicPath(filename: string): string {
  return toStoredMediaPath(`avatars/${filename}`) as string;
}

export function deleteUploadedFile(publicPath?: string | null): void {
  const stored = toStoredMediaPath(publicPath);
  if (!stored) {
    return;
  }

  const relative = stored.replace(/^\/uploads\//, '');
  const absolute = path.join(UPLOADS_ROOT, relative);

  if (fs.existsSync(absolute)) {
    fs.unlinkSync(absolute);
  }
}

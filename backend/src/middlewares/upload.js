import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { deletePhotoFile } from '../utils/fileStorage.js';

const uploadDir = path.join(process.cwd(), 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const ALLOWED_TYPES = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
};

const SIGNATURES = {
    'image/jpeg': [{ offset: 0, bytes: [0xff, 0xd8, 0xff] }],
    'image/png': [{ offset: 0, bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] }],
    'image/webp': [{ offset: 0, bytes: [0x52, 0x49, 0x46, 0x46] }, { offset: 8, bytes: [0x57, 0x45, 0x42, 0x50] }],
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const ext = ALLOWED_TYPES[file.mimetype];
        cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    },
});

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (req, file, cb) => {
    if (!Object.hasOwn(ALLOWED_TYPES, file.mimetype)) {
        const err = new Error('Format de fichier non accepté (JPEG, PNG ou WebP uniquement)');
        err.status = 400;
        return cb(err);
    }
    cb(null, true);
},
});

function uploadedFiles(req) {
    if (req.file) return [req.file];
    return Array.isArray(req.files) ? req.files : [];
}

export function hasImageSignature(header, mimetype) {
    const parts = SIGNATURES[mimetype];
    if (!parts) return false;
    return parts.every(({ offset, bytes }) => bytes.every((byte, i) => header[offset + i] === byte));
}

async function readHeader(filePath) {
    const handle = await fs.promises.open(filePath, 'r');
    try {
        const header = Buffer.alloc(12);
        await handle.read(header, 0, header.length, 0);
        return header;
    } finally {
        await handle.close();
    }
}

export function removeUploadsOnFailure(req, res, next) {
    res.on('finish', () => {
        if (res.statusCode < 400) return;
        for (const file of uploadedFiles(req)) deletePhotoFile(file.filename);
    });
    next();
}

export async function verifyImageSignatures(req, res, next) {
    try {
        for (const file of uploadedFiles(req)) {
            const header = await readHeader(file.path);
            if (!hasImageSignature(header, file.mimetype)) {
                const err = new Error("Le fichier envoyé n'est pas une image JPEG, PNG ou WebP valide");
                err.status = 400;
                return next(err);
            }
        }
        next();
    } catch (err) {
        next(err);
    }
}

export function uploadImage(field) {
    return [upload.single(field), removeUploadsOnFailure, verifyImageSignatures];
}

export function uploadImages(field, maxCount) {
    return [upload.array(field, maxCount), removeUploadsOnFailure, verifyImageSignatures];
}
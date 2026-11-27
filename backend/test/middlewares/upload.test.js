import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { EventEmitter } from 'node:events';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import * as fileStorage from '../../src/utils/fileStorage.js';
import { hasImageSignature, removeUploadsOnFailure, verifyImageSignatures } from '../../src/middlewares/upload.js';

vi.mock('../../src/utils/fileStorage.js');

const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
const WEBP = Buffer.from('RIFF\x24\x00\x00\x00WEBPVP8 ', 'latin1');
const SCRIPT = Buffer.from('<?php system($_GET["c"]); ?>');

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hch-upload-'));

function writeTmp(name, content) {
    const filePath = path.join(tmpDir, name);
    fs.writeFileSync(filePath, content);
    return filePath;
}

function makeRes(statusCode) {
    const res = new EventEmitter();
    res.statusCode = statusCode;
    return res;
}

beforeEach(() => {
    vi.resetAllMocks();
});

afterAll(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('hasImageSignature', () => {
    it('reconnaît les vrais en-têtes JPEG, PNG et WebP', () => {
        expect(hasImageSignature(JPEG, 'image/jpeg')).toBe(true);
        expect(hasImageSignature(PNG, 'image/png')).toBe(true);
        expect(hasImageSignature(WEBP, 'image/webp')).toBe(true);
    });

    it('refuse un contenu qui ne correspond pas au type annoncé', () => {
        expect(hasImageSignature(SCRIPT, 'image/jpeg')).toBe(false);
        expect(hasImageSignature(PNG, 'image/jpeg')).toBe(false);
        expect(hasImageSignature(Buffer.from('RIFF\x24\x00\x00\x00WAVEfmt ', 'latin1'), 'image/webp')).toBe(false);
    });

    it('refuse un type non prévu', () => {
        expect(hasImageSignature(JPEG, 'image/gif')).toBe(false);
    });
});

describe('verifyImageSignatures', () => {
    it('laisse passer une requête sans fichier', async () => {
        const next = vi.fn();

        await verifyImageSignatures({}, {}, next);

        expect(next).toHaveBeenCalledWith();
    });

    it('laisse passer de vraies images', async () => {
        const req = { files: [
            { path: writeTmp('a.jpg', JPEG), mimetype: 'image/jpeg' },
            { path: writeTmp('b.png', PNG), mimetype: 'image/png' },
        ] };
        const next = vi.fn();

        await verifyImageSignatures(req, {}, next);

        expect(next).toHaveBeenCalledWith();
    });

    it('refuse (400) un fichier déguisé en image', async () => {
        const req = { file: { path: writeTmp('photo.jpg', SCRIPT), mimetype: 'image/jpeg' } };
        const next = vi.fn();

        await verifyImageSignatures(req, {}, next);

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 400 }));
    });

    it('refuse un fichier vide', async () => {
        const req = { file: { path: writeTmp('vide.png', Buffer.alloc(0)), mimetype: 'image/png' } };
        const next = vi.fn();

        await verifyImageSignatures(req, {}, next);

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 400 }));
    });
});

describe('removeUploadsOnFailure', () => {
    it('supprime les fichiers envoyés quand la réponse est une erreur', () => {
        const req = { files: [{ filename: '1-a.jpg' }, { filename: '2-b.jpg' }] };
        const res = makeRes(409);
        const next = vi.fn();

        removeUploadsOnFailure(req, res, next);
        res.emit('finish');

        expect(next).toHaveBeenCalledWith();
        expect(fileStorage.deletePhotoFile).toHaveBeenCalledWith('1-a.jpg');
        expect(fileStorage.deletePhotoFile).toHaveBeenCalledWith('2-b.jpg');
    });

    it('supprime le fichier unique après un refus de validation (400)', () => {
        const req = { file: { filename: '3-c.png' } };
        const res = makeRes(400);

        removeUploadsOnFailure(req, res, vi.fn());
        res.emit('finish');

        expect(fileStorage.deletePhotoFile).toHaveBeenCalledWith('3-c.png');
    });

    it('garde les fichiers quand la requête réussit', () => {
        const req = { file: { filename: '4-d.webp' } };
        const res = makeRes(201);

        removeUploadsOnFailure(req, res, vi.fn());
        res.emit('finish');

        expect(fileStorage.deletePhotoFile).not.toHaveBeenCalled();
    });
});
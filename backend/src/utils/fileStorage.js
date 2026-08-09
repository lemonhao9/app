import fs from 'fs/promises';
import path from 'path';

export async function deletePhotoFile(photoUrl) {
    if (!photoUrl) return;
    const filePath = path.join(process.cwd(), 'uploads', path.basename(photoUrl));
    await fs.unlink(filePath).catch(() => {});
}
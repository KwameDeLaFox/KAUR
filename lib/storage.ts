import fs from 'node:fs/promises';
import path from 'node:path';

const DATA_PATH = process.env.DATA_PATH || process.cwd();
const UPLOADS_DIR = path.join(DATA_PATH, 'uploads');

export async function saveFile(projectId: number, file: File): Promise<string> {
    const projectDir = path.join(UPLOADS_DIR, projectId.toString());

    // Ensure directory exists
    await fs.mkdir(projectDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    // Sanitize filename roughly to prevent traversal or issues
    const safeName = path.basename(file.name).replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${Date.now()}-${safeName}`;
    const filePath = path.join(projectDir, filename);

    await fs.writeFile(filePath, buffer);

    // Return relative path for DB
    return path.join(UPLOADS_DIR, projectId.toString(), filename);
}

export async function deleteFileFromDisk(relativePath: string): Promise<void> {
    // relativePath is like 'uploads/1/filename.txt'
    // We need to make sure we don't double up on the 'uploads' part if UPLOADS_DIR already includes it
    // But since UPLOADS_DIR is absolute, we should join based on the base directory
    const fullPath = path.join(DATA_PATH, relativePath);
    try {
        await fs.unlink(fullPath);
    } catch (error) {
        console.error(`Failed to delete file at ${fullPath}`, error);
        // We generally suppress this so DB deletion can proceed
    }
}

export async function saveFileBuffer(projectId: number, buffer: Buffer, filename: string): Promise<string> {
    const projectDir = path.join(UPLOADS_DIR, projectId.toString());
    await fs.mkdir(projectDir, { recursive: true });

    // Sanitize filename
    const safeName = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = path.join(projectDir, safeName);

    await fs.writeFile(filePath, buffer);

    return path.join(UPLOADS_DIR, projectId.toString(), safeName);
}

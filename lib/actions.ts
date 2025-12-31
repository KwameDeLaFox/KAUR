'use server'

import { revalidatePath } from 'next/cache';
import db from './db';
import { extractText } from './extraction';
import { generateProjectOutput } from './ai';

export interface Project {
    id: number;
    name: string;
    description: string | null;
    created_at: string;
    updated_at: string;
    file_count: number;
}

export interface FileRecord {
    id: number;
    project_id: number;
    name: string;
    path: string;
    type: string;
    size: number;
    is_generated: number;
    created_at: string;
}

export interface ProjectWithFiles extends Project {
    files: FileRecord[];
}

export async function getProjects(): Promise<Project[]> {
    const stmt = db.prepare(`
    SELECT p.*, COUNT(f.id) as file_count 
    FROM projects p 
    LEFT JOIN files f ON p.id = f.project_id 
    GROUP BY p.id 
    ORDER BY p.updated_at DESC
  `);
    return stmt.all() as Project[];
}

export async function getProject(id: number): Promise<ProjectWithFiles | undefined> {
    const projectStmt = db.prepare('SELECT * FROM projects WHERE id = ?');
    const project = projectStmt.get(id) as Project;

    if (!project) return undefined;

    const filesStmt = db.prepare('SELECT * FROM files WHERE project_id = ? ORDER BY created_at DESC');
    const files = filesStmt.all(id) as FileRecord[];

    return {
        ...project,
        files,
        file_count: files.length
    };
}

export async function createProject(formData: FormData) {
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;

    if (!name) {
        throw new Error('Name is required');
    }

    const stmt = db.prepare('INSERT INTO projects (name, description) VALUES (?, ?)');
    stmt.run(name, description);

    revalidatePath('/projects');
}

export async function deleteProject(id: number) {
    // SQLite ON DELETE CASCADE handles files, but we need to clean up disk
    const filesStmt = db.prepare('SELECT path FROM files WHERE project_id = ?');
    const files = filesStmt.all(id) as { path: string }[];

    for (const file of files) {
        await deleteFileFromDisk(file.path);
    }

    const stmt = db.prepare('DELETE FROM projects WHERE id = ?');
    stmt.run(id);

    revalidatePath('/projects');
}

import { saveFile, deleteFileFromDisk, saveFileBuffer } from './storage';
import { PresentationService, PptSlideData } from './presentation';

export async function uploadFile(projectId: number, formData: FormData) {
    const file = formData.get('file') as File;

    if (!file) {
        throw new Error('No file provided');
    }

    const relativePath = await saveFile(projectId, file);

    const stmt = db.prepare(`
      INSERT INTO files (project_id, name, path, type, size, is_generated)
      VALUES (?, ?, ?, ?, ?, ?)
  `);

    stmt.run(projectId, file.name, relativePath, file.type, file.size, 0);

    // Update project updated_at
    db.prepare('UPDATE projects SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(projectId);

    revalidatePath(`/projects/${projectId}`);
    revalidatePath('/projects');
}

export async function deleteFile(fileId: number, projectId: number) {
    const fileStmt = db.prepare('SELECT path FROM files WHERE id = ?');
    const file = fileStmt.get(fileId) as { path: string } | undefined;

    if (file) {
        await deleteFileFromDisk(file.path);
    }

    const stmt = db.prepare('DELETE FROM files WHERE id = ?');
    stmt.run(fileId);

    revalidatePath(`/projects/${projectId}`);
    revalidatePath('/projects');
}

export async function generateInsight(projectId: number, goal: string, type: string, options?: any) {
    // 1. Fetch files
    const filesStmt = db.prepare('SELECT * FROM files WHERE project_id = ?');
    const files = filesStmt.all(projectId) as FileRecord[];

    if (files.length === 0) {
        throw new Error("No context files found in this project. Please upload some documents first.");
    }

    // 2. Extract text (limit to top 10 files for simple MVP to avoid blowing context/time)
    let context = "";
    const processingFiles = files.slice(0, 10);

    // Process sequentially for safety in serverless/simple env, parallel could vary
    for (const file of processingFiles) {
        const text = await extractText(file);
        context += text + "\n";
    }

    // 3. Generate
    const result = await generateProjectOutput(context, goal, type, options);

    return result;
}

export async function generatePresentationAction(projectId: number, options?: any) {
    // 1. Fetch files
    const filesStmt = db.prepare('SELECT * FROM files WHERE project_id = ?');
    const files = filesStmt.all(projectId) as FileRecord[];

    if (files.length === 0) {
        throw new Error("No context files found.");
    }

    // 2. Extract context
    let context = "";
    const processingFiles = files.slice(0, 10);
    for (const file of processingFiles) {
        context += await extractText(file) + "\n";
    }

    // 3. AI
    const jsonString = await generateProjectOutput(context, "Generate a summary presentation", "Presentation", options);
    let slides: PptSlideData[] = [];
    try {
        const parsed = JSON.parse(jsonString);
        // Handle both wrapped object format and direct array format
        slides = parsed.slides || parsed;

        if (!Array.isArray(slides)) {
            throw new Error("Expected slides to be an array");
        }
    } catch (e) {
        console.log("JSON parse error, trying clean", e);
        // fallback if markdown wrapped
        const clean = jsonString.replace(/```json/g, '').replace(/```/g, '');
        const parsed = JSON.parse(clean);
        slides = parsed.slides || parsed;
    }

    // 4. Generate PPT
    const service = new PresentationService();
    const buffer = await service.generatePresentation(slides);

    // 5. Save
    const filename = `Presentation_${Date.now()}.pptx`;
    const relativePath = await saveFileBuffer(projectId, buffer, filename);

    // 6. DB Record
    const stmt = db.prepare(`
      INSERT INTO files (project_id, name, path, type, size, is_generated)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const size = buffer.length;
    stmt.run(projectId, filename, relativePath, 'application/vnd.openxmlformats-officedocument.presentationml.presentation', size, 1);

    // 7. Update Project
    db.prepare('UPDATE projects SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(projectId);

    revalidatePath(`/projects/${projectId}`);
    return true;
}

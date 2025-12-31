import fs from 'node:fs/promises';
import path from 'node:path';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import { FileRecord } from './actions';

export async function extractText(file: FileRecord): Promise<string> {
    const fullPath = path.join(process.cwd(), file.path);
    const buffer = await fs.readFile(fullPath);

    try {
        if (file.type === 'application/pdf') {
            const data = await pdf(buffer);
            return `File: ${file.name}\nType: PDF\nContent:\n${data.text}\n---\n`;
        }
        else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') { // docx
            const result = await mammoth.extractRawText({ buffer });
            return `File: ${file.name}\nType: DOCX\nContent:\n${result.value}\n---\n`;
        }
        else if (file.type.startsWith('text/') || file.type === 'application/json') {
            const text = buffer.toString('utf-8');
            return `File: ${file.name}\nType: Text\nContent:\n${text}\n---\n`;
        }

        return `File: ${file.name}\n[Skipped: Unsupported type ${file.type}]\n---\n`;

    } catch (error) {
        console.error(`Failed to extract text from ${file.name}`, error);
        return `File: ${file.name}\n[Error extracting text]\n---\n`;
    }
}

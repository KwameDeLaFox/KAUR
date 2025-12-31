
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const db = new Database('ura.db');

// Sample Transcripts
const transcript1 = `
INTERVIEWER: Thanks for joining us. Let's talk about your experience with the new mobile app.
PARTICIPANT: Sure. I found the onboarding a bit confused.
INTERVIEWER: Can you elaborate?
PARTICIPANT: There were too many steps. I just wanted to get to the dashboard. But once I was in, the charts were really helpful.
INTERVIEWER: What about the colors?
PARTICIPANT: The dark mode is great, but the red alerts are a bit too aggressive.
`;

const transcript2 = `
INTERVIEWER: How do you usually export your reports?
PARTICIPANT: I usually take a screenshot.
INTERVIEWER: You don't use the PDF export?
PARTICIPANT: I didn't know it existed! The button is hidden in the settings menu. It should be on the main chart area.
`;

async function seed() {
    console.log("Seeding data...");

    // 1. Create Project
    const stmt = db.prepare('INSERT INTO projects (name, description) VALUES (?, ?)');
    const info = stmt.run("Sample Research Project", "A generated project with sample transcripts to test the PowerPoint feature.");
    const projectId = info.lastInsertRowid;
    console.log(`Created Project ID: ${projectId}`);

    // 2. Create Directory
    const uploadDir = path.join(process.cwd(), 'uploads', projectId.toString());
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    // 3. Create Files
    const files = [
        { name: "onboarding_feedback.txt", content: transcript1 },
        { name: "export_flow_interview.txt", content: transcript2 }
    ];

    const insertFile = db.prepare(`
        INSERT INTO files (project_id, name, path, type, size)
        VALUES (?, ?, ?, ?, ?)
    `);

    for (const file of files) {
        const filePath = path.join(uploadDir, file.name);
        fs.writeFileSync(filePath, file.content);

        const relativePath = path.join('uploads', projectId.toString(), file.name);
        insertFile.run(projectId, file.name, relativePath, 'text/plain', file.content.length);
        console.log(`Added file: ${file.name}`);
    }

    // 4. Update project time
    db.prepare('UPDATE projects SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(projectId);

    console.log("Done! You can now refresh the app and see 'Sample Research Project'.");
}

seed();

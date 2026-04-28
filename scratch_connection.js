const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace import
    let newContent = content.replace(/import \{ queryHv5 \} from '@\/lib\/db-hv5';/g, "import { query } from '@/lib/db';");
    
    // Replace function call
    newContent = newContent.replace(/queryHv5\(/g, 'query(');
    
    if (content !== newContent) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`Updated connection in ${filePath}`);
    }
}

function walk(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walk(fullPath);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
            replaceInFile(fullPath);
        }
    }
}

walk(path.join(__dirname, 'app/api/property'));

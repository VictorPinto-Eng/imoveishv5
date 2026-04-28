const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Revert imob_hv5.apo back to public.apo
    let newContent = content.replace(/imob_hv5\.apo/g, 'public.apo');
    
    // Revert imob_hv5.imb back to public.imb
    newContent = newContent.replace(/imob_hv5\.imb/g, 'public.imb');
    
    if (content !== newContent) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`Reverted ${filePath}`);
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

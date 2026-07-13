const fs = require('fs');
const path = require('path');

const replacements = [
  { search: /bg-\[#f5f9f9\]/g, replace: 'bg-bg' },
  { search: /bg-white(?!\/)/g, replace: 'bg-surface' }, 
  { search: /bg-white\/80/g, replace: 'bg-surface/80' },
  { search: /text-\[#1a2e2e\]/g, replace: 'text-text-main' },
  { search: /text-\[#555555\]/g, replace: 'text-text-muted' },
  { search: /text-\[#008080\]/g, replace: 'text-accent-primary' },
  { search: /text-\[#00c8c8\]/g, replace: 'text-accent-secondary' },
  { search: /border-\[#e0f2f2\]/g, replace: 'border-border' },
  { search: /border-\[#b2d8d8\]/g, replace: 'border-border' },
  { search: /bg-\[#008080\]/g, replace: 'bg-accent-primary' },
  { search: /hover:bg-\[#006666\]/g, replace: 'hover:bg-accent-primary/80' },
  { search: /hover:bg-\[#f5f9f9\]/g, replace: 'hover:bg-surface-hover' },
  { search: /hover:bg-\[#e0f2f2\]/g, replace: 'hover:bg-surface-hover' },
  { search: /hover:text-\[#008080\]/g, replace: 'hover:text-accent-primary' },
  { search: /hover:border-\[#008080\]/g, replace: 'hover:border-accent-primary' },
  { search: /hover:bg-\[#e0f2f2\]\/30/g, replace: 'hover:bg-surface-hover/30' },
  { search: /hover:bg-\[#e0f2f2\]\/50/g, replace: 'hover:bg-surface-hover/50' },
  { search: /focus:border-\[#008080\]/g, replace: 'focus:border-accent-primary' },
  { search: /focus:ring-\[#008080\](?![\/])/g, replace: 'focus:ring-accent-primary' },
  { search: /focus:ring-\[#008080\]\/20/g, replace: 'focus:ring-accent-primary/20' },
  { search: /from-\[#008080\]/g, replace: 'from-accent-primary' },
  { search: /to-\[#005555\]/g, replace: 'to-accent-primary/70' },
  { search: /shadow-\[#008080\]\/20/g, replace: 'shadow-accent-primary/20' },
  { search: /shadow-\[#008080\]\/30/g, replace: 'shadow-accent-primary/30' },
  { search: /hover:shadow-\[#008080\]\/30/g, replace: 'hover:shadow-accent-primary/30' },
  { search: /placeholder-\[#8ab8b8\]/g, replace: 'placeholder-text-muted' },
  { search: /placeholder-\[#555555\]/g, replace: 'placeholder-text-muted' },
  { search: /text-\[#8ab8b8\]/g, replace: 'text-text-muted' },
  { search: /bg-\[#008080\]\/10/g, replace: 'bg-accent-primary/10' },
  { search: /bg-\[#008080\]\/15/g, replace: 'bg-accent-primary/15' },
  { search: /bg-\[#008080\]\/20/g, replace: 'bg-accent-primary/20' },
  { search: /bg-\[#008080\]\/5/g, replace: 'bg-accent-primary/5' },
  { search: /border-\[#008080\]\/20/g, replace: 'border-accent-primary/20' },
  { search: /border-\[#008080\]\/30/g, replace: 'border-accent-primary/30' },
  { search: /bg-\[#f5f9f9\]\/50/g, replace: 'bg-bg/50' },
  { search: /bg-\[#e0f2f2\](?![\/])/g, replace: 'bg-surface-hover' },
  { search: /bg-\[#e0f2f2\]\/30/g, replace: 'bg-surface-hover/30' },
  { search: /bg-\[#e0f2f2\]\/50/g, replace: 'bg-surface-hover/50' },
  { search: /text-\[#ff6b6b\]/g, replace: 'text-red-400' },
  { search: /hover:text-\[#ff6b6b\]/g, replace: 'hover:text-red-400' },
  { search: /bg-\[#ff6b6b\]\/10/g, replace: 'bg-red-400/10' },
  { search: /hover:bg-\[#ff6b6b\]\/10/g, replace: 'hover:bg-red-400/10' },
  { search: /bg-red-50(?![\s0-9a-zA-Z\-])/g, replace: 'bg-red-50 dark:bg-red-500/10' }, 
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  replacements.forEach(({ search, replace }) => {
    content = content.replace(search, replace);
  });

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Modified: ${filePath}`);
  }
}

function walkDir(dir) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      processFile(fullPath);
    }
  });
}

const targetDir = process.argv[2] || '.';
walkDir(targetDir);
console.log('Migration complete.');

import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const ignoredDirs = new Set(['.git', '.idea', '.vscode', '.uploads', 'dist', 'node_modules']);
const checkedExtensions = new Set(['.css', '.html', '.js', '.json', '.md', '.ts', '.vue']);
const suspiciousPattern = /\uFFFD|鈥|锟|鍩|璁|澹|鐢|绱|棰|缂|撳|€|鑷|浣跨敤|鎼滅储/u;
const findings = [];

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!ignoredDirs.has(entry.name)) await walk(path.join(dir, entry.name));
      continue;
    }

    const ext = path.extname(entry.name);
    if (!checkedExtensions.has(ext)) continue;

    const file = path.join(dir, entry.name);
    if (path.relative(root, file) === path.join('scripts', 'check-mojibake.mjs')) continue;
    const text = await readFile(file, 'utf8');
    const lines = text.split(/\r?\n/);
    for (const [index, line] of lines.entries()) {
      if (suspiciousPattern.test(line)) {
        findings.push(`${path.relative(root, file)}:${index + 1}: ${line.trim().slice(0, 160)}`);
      }
    }
  }
}

await walk(root);

if (findings.length) {
  console.error('Possible mojibake found:');
  for (const finding of findings) console.error(`  ${finding}`);
  process.exit(1);
}

console.log('No mojibake markers found.');

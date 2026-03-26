import { cpSync, existsSync, rmSync } from 'fs';
import { resolve } from 'path';

const repoRoot = resolve(process.cwd());
const source = resolve(repoRoot, 'landpage');
const target = resolve(repoRoot, 'public', 'landpage');

if (!existsSync(source)) {
  console.error('No landing page directory found at repo root.');
  process.exit(1);
}

try {
  // Clean any previous copy to keep the public version in sync with edits.
  rmSync(target, { recursive: true, force: true });
  cpSync(source, target, { recursive: true });
  console.log(`Synced ${source} -> ${target}`);
} catch (error) {
  console.error('Failed to sync landing page assets:', error);
  process.exit(1);
}

import { cpSync, existsSync, rmSync } from 'fs';
import { resolve } from 'path';

const source = resolve(process.cwd(), 'landpage');
const target = resolve(process.cwd(), 'public', 'landpage');

if (!existsSync(source)) {
  console.error(
    `No landing page directory found at ${source}. Ensure the landing page source folder (/landpage) exists before running dev/build.`,
  );
  process.exit(1);
}

try {
  // Clean any previous copy to keep the public version in sync with edits.
  rmSync(target, { recursive: true, force: true });
  cpSync(source, target, { recursive: true });
  console.log(`Synced ${source} -> ${target}`);
} catch (error) {
  console.error(
    `Failed to sync landing page assets from ${source} to ${target}. Check permissions or disk space and retry.`,
    error,
  );
  process.exit(1);
}

import { copyFileSync, existsSync } from 'fs';
import { join } from 'path';

/** GitHub Pages needs 404.html for client-side routing on project sites. */
const indexPath = join('dist', 'index.html');
const fallbackPath = join('dist', '404.html');

if (existsSync(indexPath)) {
  copyFileSync(indexPath, fallbackPath);
  console.log('Copied dist/index.html -> dist/404.html');
}

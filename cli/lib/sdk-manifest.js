import { basename, dirname, join, resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const sdkPath = resolve(__dirname, '..', '..');
export const sdkName = basename(sdkPath);

const manifestPath = join(sdkPath, 'manifest.json');
export const sdkManifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

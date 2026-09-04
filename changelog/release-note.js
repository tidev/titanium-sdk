#!/usr/bin/env node
/**
 * Writes one release's notes in the shape titaniumsdk.com stores them.
 *
 * The changelog machinery already produces the body — `npm run build:changelog`
 * appends it to CHANGELOG.md. What the docs site needs on top is frontmatter:
 * a title, and a date as its own field.
 *
 * That date is the point of this script. Until now the release note was made by
 * hand from the CHANGELOG section, and the date only ever existed inside the
 * title — "Titanium SDK 13.4.1.GA - 25 August 2026" — so nothing downstream
 * could read it without parsing prose. conventional-changelog already knows the
 * date; it prints it in the heading this replaces.
 *
 *   node changelog/release-note.js --channel GA --out path/to/release-notes.md
 *
 * With no --out it prints to stdout, which is how to look at one without
 * writing anything.
 */

import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'fs-extra';

const __dirname = dirname(fileURLToPath(import.meta.url));
const { version } = fs.readJSONSync(join(__dirname, '../package.json'));

function arg(name, fallback) {
	const i = process.argv.indexOf(`--${name}`);
	return i === -1 ? fallback : process.argv[i + 1];
}

const channel = arg('channel', 'GA');
const out = arg('out');

// -r 1 is the release being cut. The config resolves what to compare against.
const body = execFileSync(
	process.execPath,
	[
		join(__dirname, '../node_modules/.bin/conventional-changelog'),
		'-n', join(__dirname, 'config.js'),
		'-p', 'angular',
		'-r', '1'
	],
	{ encoding: 'utf8', cwd: join(__dirname, '..') }
);

// `# [14.0.0](https://.../compare/13_4_1_GA...14.0.0) (2026-09-04)` — or `##`
// for a patch. The date is the only thing taken from it; the heading itself is
// dropped, because the page renders the title from frontmatter.
const heading = /^#{1,6}\s+.*?\((\d{4}-\d{2}-\d{2})\)\s*$/m.exec(body);
if (!heading) {
	console.error(
		'no dated heading in the generated changelog — refusing to write a note with no date.\n' +
		'This is what conventional-changelog emits first; if the template changed, update this script.'
	);
	process.exit(1);
}

const frontmatter = [
	'---',
	`title: Titanium SDK ${version}.${channel}`,
	`date: ${heading[1]}`,
	`version: ${version}`,
	`channel: ${channel}`,
	'---'
].join('\n');

const note = `${frontmatter}\n${body.slice(heading.index + heading[0].length).replace(/^\n+/, '\n')}`;

if (!out) {
	process.stdout.write(note);
} else {
	mkdirSync(dirname(out), { recursive: true });
	writeFileSync(out, note.endsWith('\n') ? note : `${note}\n`);
	console.log(`${version}.${channel} release note written to ${out}`);
}

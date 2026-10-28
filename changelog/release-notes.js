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
 *   node changelog/release-notes.js --channel GA --out path/to/release-notes.md
 *
 * With no --out it prints to stdout, which is how to look at one without
 * writing anything. --no-fetch skips the git fetch below, for running offline.
 */

import { execFileSync, spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'fs-extra';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');
const { version } = fs.readJSONSync(join(repoRoot, 'package.json'));

function arg(name, fallback) {
	const i = process.argv.indexOf(`--${name}`);
	return i === -1 ? fallback : process.argv[i + 1];
}

const channel = arg('channel', 'GA');
const out = arg('out');

/**
 * Brings the tags — and the history behind them — into the clone.
 *
 * The baseline these notes are measured from is a GA tag, so a clone without
 * tags has nothing to measure from. A shallow clone is worse than that: a tag
 * fetched with `--depth` is grafted with no ancestry behind it, shares no merge
 * base with HEAD, and quietly turns the release range into the whole
 * repository. `--unshallow` is what repairs that, and it refuses to run on a
 * complete clone, so which of the two to ask for has to be decided first.
 *
 * Failing here is not fatal. The clone may already hold everything needed, and
 * the changelog config validates the baseline it ends up with either way.
 */
function fetchTags() {
	const git = (args, stdio) => execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8', stdio });
	try {
		const shallow = git([ 'rev-parse', '--is-shallow-repository' ], [ 'ignore', 'pipe', 'ignore' ]).trim() === 'true';
		// git's stdout is discarded rather than inherited: with no --out, ours is
		// the note itself. Progress goes to stderr, which is worth seeing —
		// deepening a shallow clone is not quick.
		git([ 'fetch', ...(shallow ? [ '--unshallow' ] : []), '--tags' ], [ 'ignore', 'ignore', 'inherit' ]);
	} catch (err) {
		console.warn(`warning: could not fetch tags (${err.message.split('\n')[0]}); using what the clone already has`);
	}
}

/**
 * Runs conventional-changelog for the release being cut and returns everything
 * it wrote to stdout. `-r 1` is that release; the config resolves what to
 * compare it against.
 *
 * Read off the pipe rather than with `execFileSync`, which caps stdout at
 * `maxBuffer` — 1 MiB — and throws ENOBUFS past it. A major release's changelog
 * is comfortably larger than that: 14.0.0 generates over 4 MiB, so every major
 * would have failed here. Chunks are joined as buffers, not strings, so a
 * multi-byte character split across a chunk boundary survives.
 *
 * @returns {Promise<string>} the generated changelog
 */
function generateChangelog() {
	return new Promise((resolve, reject) => {
		const child = spawn(
			process.execPath,
			[
				join(__dirname, '../node_modules/.bin/conventional-changelog'),
				'-n', join(__dirname, 'config.js'),
				'-p', 'angular',
				'-r', '1'
			],
			// stderr inherited so warnings stay visible as they happen, and
			// stay out of the note on the stdout path.
			{ cwd: repoRoot, env: { ...process.env, TI_RELEASE_CHANNEL: channel }, stdio: [ 'ignore', 'pipe', 'inherit' ] }
		);
		const chunks = [];

		child.stdout.on('data', chunk => chunks.push(chunk));
		child.on('error', reject);
		child.on('close', (code, signal) => {
			if (code === 0) {
				resolve(Buffer.concat(chunks).toString('utf8'));
			} else {
				reject(new Error(
					`conventional-changelog ${signal ? `was killed by ${signal}` : `exited with ${code}`}`
				));
			}
		});
	});
}

if (!process.argv.includes('--no-fetch')) {
	fetchTags();
}

const body = await generateChangelog();

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

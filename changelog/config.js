import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import fs from 'fs-extra';
import semver from 'semver';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageJSON = fs.readJSONSync(path.join(__dirname, '../package.json'));
const previous = previousRelease(packageJSON.version);

function groupBy(list, keyGetter) {
	const map = new Map();
	list.forEach((item) => {
		const key = keyGetter(item);
		const collection = map.get(key);
		if (!collection) {
			map.set(key, [ item ]);
		} else {
			collection.push(item);
		}
	});
	return map;
}

/**
 * Change known scopes to prettier values in our grouping titles
 * @param {string} rawScope scope from the commit message
 * @returns {string}
 */
function prettifiedScope(rawScope) {
	switch (rawScope) {
		case 'android':
			return 'Android platform';
		case 'ios':
			return 'iOS platform';
		default:
			return 'Multiple platforms';
	}
}

/**
 * The release these notes are measured from: the newest GA release older than
 * the one being cut.
 *
 * Every release is tagged `<major>_<minor>_<patch>_GA`, so the tags are the
 * record of what actually shipped. This used to guess at a maintenance branch
 * instead, which failed two ways: a bare name like `14_0_X` does not resolve on
 * a CI checkout, where the branch exists only as `origin/14_0_X`, and a branch
 * tip is not a release.
 *
 * Picking by version rather than by reachability keeps maintenance releases
 * right — cutting 13.4.2 compares against 13.4.1 even though 14.0.0 has already
 * shipped from main — and needs no knowledge of how the branches are laid out.
 *
 * @param {string} version the version being released
 * @returns {{ tag: string, sha: string }} the tag and the commit it points at
 */
function previousRelease(version) {
	const released = execSync('git tag --list "*_GA"', { encoding: 'utf8' })
		.split(/\r?\n/)
		// `1_8_0_1_GA` is the one four-part tag in the repo's history. Dropping
		// what does not parse also drops it, and it predates anything we would
		// ever compare against.
		.map(line => /^(\d+)_(\d+)_(\d+)_GA$/.exec(line.trim()))
		.filter(Boolean)
		.map(([ tag, major, minor, patch ]) => ({ tag, version: `${major}.${minor}.${patch}` }))
		.filter(release => semver.lt(release.version, version))
		.sort((a, b) => semver.compare(a.version, b.version));

	const previous = released[released.length - 1];
	if (!previous) {
		throw new Error(`cannot find a GA release older than ${version} to generate notes from`);
	}

	// The commit, not the tag. `from` is handed to `git log`, and a sha resolves
	// without depending on which refs a checkout happens to have fetched.
	const sha = execSync(`git rev-list -n 1 ${previous.tag}`, { encoding: 'utf8' }).trim();

	// A tag fetched with `--depth` is grafted with no history behind it, so it
	// shares no ancestor with HEAD and the symmetric difference below degenerates
	// to every commit in the repository. That does not fail — it quietly yields a
	// release note spanning the whole project, so check for it here.
	let mergeBase = '';
	try {
		mergeBase = execSync(`git merge-base ${sha} HEAD`, {
			encoding: 'utf8',
			stdio: [ 'ignore', 'pipe', 'ignore' ]
		}).trim();
	} catch {
		// exit 1 is "no common ancestor"; a broken git would have thrown above
	}
	if (!mergeBase) {
		throw new Error(
			`${previous.tag} (${sha.slice(0, 10)}) shares no history with HEAD, so the range would be `
			+ 'the entire repository rather than one release.\n'
			+ 'A shallow clone does this; `git fetch --unshallow --tags` repairs it. release-notes.js\n'
			+ 'runs that itself, so reaching this through it means the fetch was skipped or failed.'
		);
	}

	return { tag: previous.tag, sha };
}

function urlToVersion(url) {
	return /-(\d+\.\d+\.\d+)\.zip$/.exec(url)[1];
}

function gatherModules() {
	const modulesJSON = fs.readJSONSync(path.join(__dirname, '../support/module/packaged/modules.json'));
	const modules = new Map();
	// Android
	Object.entries(modulesJSON.android).forEach(entry => {
		const moduleId = entry[0];
		const version = urlToVersion(entry[1].url);
		modules.set(moduleId, { name: moduleId, android: version, ios: 'n/a' });
	});
	// iOS
	Object.entries(modulesJSON.ios).forEach(entry => {
		const moduleId = entry[0];
		const version = urlToVersion(entry[1].url);
		if (modules.has(moduleId)) {
			const androidVersion = modules.get(moduleId).android;
			modules.set(moduleId, { name: moduleId, android: androidVersion, ios: version });
		} else {
			modules.set(moduleId, { name: moduleId, android: 'n/a', ios: version });
		}
	});
	// CommonJS
	Object.entries(modulesJSON.commonjs).forEach(entry => {
		const moduleId = entry[0];
		const version = urlToVersion(entry[1].url);
		modules.set(moduleId, { name: moduleId, android: version, ios: version });
	});
	// Hyperloop
	const hyperloopVersion = urlToVersion(modulesJSON.hyperloop.hyperloop.url);
	modules.set('hyperloop', { name: 'hyperloop', android: hyperloopVersion, ios: hyperloopVersion });

	return modules;
}

/**
 * Gather up the community contributions to thank them specifically
 */
const communityContributions = new Map();
const breakingChanges = []; // gather the breaking changes specially

/**
 * @param {string} from branch/tag/commit sha to start
 * @returns {Set<string>} array of valid commit shas
 */
function getFilteredShaListing(from) {
	const stdout = execSync(`git log --cherry-pick --right-only --no-merges ${from}...HEAD --format=%H`, { encoding: 'utf8' });
	return new Set(stdout.split(/\r?\n/));
}

const filteredCommitSHAs = getFilteredShaListing(previous.sha);

export default {
	gitRawCommitsOpts: {
		// 'right-only': true, // --right-only
		// 'cherry-pick': true, // --cherry-pick
		// merges: false, // --no-merges
		// NOTE: This does a 9_0_X..HEAD comparison, but we need a 9_0_X...HEAD comparison with cherry-picks removed
		// We do that above by getting the hashes of that subset and then skip anythign this collects that don't fall into that set
		from: previous.sha,
		// We override to include authorName and authorEmail!
		format: '%B%n-hash-%n%H%n-gitTags-%n%d%n-committerDate-%n%ci%n-authorName-%n%an%n-authorEmail-%n%ae'
	},
	writerOpts: {
		transform: function (commit) {
			// conventional-changelog now freezes commit objects; clone before mutating
			commit = {
				...commit,
				notes: (commit.notes || []).map(note => ({ ...note })),
				references: [ ...(commit.references || []) ],
			};
			// skip commits that may have cherry-picks on both sides
			if (!filteredCommitSHAs.has(commit.hash)) {
				return;
			}

			let discard = true;
			let community = true;
			let breaking = false;

			// Special handling of breaking changes. We gather them in a separate array
			// and place them all together (so discard them from the normal listings)
			commit.notes.forEach(note => {
				note.title = 'BREAKING CHANGES';
				discard = true;
				breaking = true;
			});

			// ensure scope is lowercase
			if (typeof commit.scope === 'string') {
				if (commit.scope === '*') {
					commit.scope = '';
				} else {
					commit.scope = commit.scope.toLowerCase();
				}
			}

			// Limit to features, bug fixes and performance improvements
			if (commit.type === 'feat') {
				commit.type = 'Features';
				discard = false;
			} else if (commit.type === 'fix') {
				commit.type = 'Bug Fixes';
				discard = false;
			} else if (commit.type === 'perf') {
				commit.type = 'Performance Improvements';
			} else if (discard && !community && !breaking) {
				return; // ignore this commit!
			// Only retain other types of commits if they somehow contain breaking changes...
			} else if (commit.type === 'revert') {
				commit.type = 'Reverts';
			} else if (commit.type === 'docs') {
				commit.type = 'Documentation';
			} else if (commit.type === 'style') {
				commit.type = 'Styles';
			} else if (commit.type === 'refactor') {
				commit.type = 'Code Refactoring';
			} else if (commit.type === 'test') {
				commit.type = 'Tests';
			} else if (commit.type === 'build') {
				commit.type = 'Build System';
			} else if (commit.type === 'ci') {
				commit.type = 'Continuous Integration';
			} else {
				commit.type = 'Miscellaneous'; // no type was provided! Assume bug fix?
			}

			// Add shorthash for linking to commit
			if (typeof commit.hash === 'string') {
				commit.shortHash = commit.hash.substring(0, 7);
			}

			// Find references to JIRA tickets
			let footer;
			if (typeof commit.footer === 'string') {
				footer = commit.footer;
			} else if (typeof commit.body === 'string') {
				footer = commit.body;
			}
			if (footer) {
				const matches = footer.match(/((TIMOB|MOD)-[0-9]+)/g);
				(matches || []).forEach(m => {
					const ticket = m;
					commit.references.push({
						action: 'Fixes',
						owner: null,
						repository: null,
						issue: ticket,
						raw: ticket,
						prefix: null
					});
				});
			}

			// Strip github PR numbers from subjects (maybe we should link to these instead of the actual commits?)
			if (typeof commit.subject === 'string') {
				commit.subject = commit.subject.replace(/ \(#\d+\)/, '');
			}
			// remove github issue references!
			commit.references = commit.references.filter(r => r.prefix !== '#');

			if (community) {
				const commits = communityContributions.get(commit.authorName) || [];
				commits.push(commit);
				communityContributions.set(commit.authorName, commits);
				// We may have a commit that community provided that we wanted to massage for community credits but not include in the overall listing
				if (discard) {
					return;
				}
			}

			// was this a breaking change? We have a special place for that!
			if (breaking) {
				breakingChanges.push(commit);
				// it may have been a refactoring or other change we don't normally list,
				// so don't include whatever random category it was
				if (discard) {
					return;
				}
			}

			return commit;
		},
		finalizeContext: function (context) {
			// Control how the version compare link is generated
			context.linkCompare = true;
			context.previousTag = previous.tag;
			context.currentTag = packageJSON.version;

			// Here we hack the generated commitGroups which sorted commits by type (feature, bug fix, etc)
			// And we introduce a second level grouping by scope (platform!)
			context.commitGroups = context.commitGroups.map(group => {
				const grouped = groupBy(group.commits, commit => prettifiedScope(commit.scope));
				const scopeGroups = [];
				grouped.forEach((val, key) => {
					scopeGroups.push({ title: key, commits: val });
				});
				// scopeGroups should be an array with properties title and commits
				return {
					title: group.title,
					scopeGroups
				};
			});

			// HACK the breaking change commits into one heading with sub-headings by platform
			if (breakingChanges.length > 0) {
				const grouped = groupBy(breakingChanges, commit => prettifiedScope(commit.scope));
				const scopeGroups = [];
				grouped.forEach((val, key) => {
					scopeGroups.push({ title: key, commits: val });
				});
				context.noteGroups = [
					{
						title: 'BREAKING CHANGES',
						scopeGroups
					}
				];
			} else {
				context.noteGroups = null;
			}

			// convert communityContributions from map to array of objects!
			context.communityContributions = [];
			communityContributions.forEach((value, key) => {
				context.communityContributions.push({
					name: key,
					commits: value
				});
			});

			// We need to know not only if it a release is a patch release, but also if its major or minor
			if (context.version && semver.valid(context.version)) {
				context.isMajor = !context.isPatch && semver.minor(context.version) === 0;
			}

			// The identifier `ti sdk install` takes: version and channel, e.g.
			// `14.0.0.GA`. release-notes.js passes the channel it was asked for;
			// reaching here without one means `npm run build:changelog`, which
			// only ever describes a GA release.
			context.sdkVersion = `${context.version}.${process.env.TI_RELEASE_CHANNEL || 'GA'}`;

			// Set End of Support date based on whether this is mjaor or minor/patch.
			// Major means EoS 12 months from now for last major line.
			// Minor/Patch means EoS 6 months from now for last minor
			const eosDate = new Date();
			if (context.isMajor) {
				eosDate.setMonth(eosDate.getMonth() + 12);
				// if isMajor, subtract one from major, add '.x', e.g. 8.0.0 -> '7.x'
				context.eosBranch = `${semver.major(context.version) - 1}.x`;
			} else {
				if (!context.isPatch) { // should be minor!
					// if isMinor, subtract one from minor, add .x, e.g. 8.1.0 -> 8.0.x
					context.eosBranch = `${semver.major(context.version)}.${semver.minor(context.version) - 1}.x`;
					context.patchBranch = `${semver.major(context.version)}.${semver.minor(context.version)}.x`;
					context.majorBranch = `${semver.major(context.version)}.x`;
				} else {
					// Patch, so mark previous patch release as EoS
					context.eosBranch = `${semver.major(context.version)}.${semver.minor(context.version)}.${semver.patch(context.version) - 1}`;
				}
				eosDate.setMonth(eosDate.getMonth() + 6);
			}

			// yyyy-mm-dd
			context.eosDate = eosDate.toISOString().split('T')[0];

			// Gather up the modules shipped with this version and toss into a variable we can put into the changelog
			const modules = gatherModules();
			context.modules = Array.from(modules.values());

			return context;
		},
		commitPartial: fs.readFileSync(path.join(__dirname, 'templates/commit.hbs'), 'utf8'),
		headerPartial: fs.readFileSync(path.join(__dirname, 'templates/header.hbs'), 'utf8'),
		footerPartial: fs.readFileSync(path.join(__dirname, 'templates/footer.hbs'), 'utf8'),
		mainTemplate: fs.readFileSync(path.join(__dirname, 'templates/template.hbs'), 'utf8'),
		partials: {
			about: fs.readFileSync(path.join(__dirname, 'templates/about.hbs'), 'utf8'),
			credits: fs.readFileSync(path.join(__dirname, 'templates/credits.hbs'), 'utf8'),
			modules: fs.readFileSync(path.join(__dirname, 'templates/modules.hbs'), 'utf8'),
		},
		groupBy: 'type',
		commitGroupsSort: 'title', // FIXME: Sort so features comes before bug fixes, then perf improvements? Can we bake in community credits?
		commitsSort: [ 'scope', 'subject' ],
		noteGroupsSort: 'title',
	}
};

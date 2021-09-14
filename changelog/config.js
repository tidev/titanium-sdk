'use strict';

const path = require('path');
const semver = require('semver');
const dateFormat = require('dateformat');
const fs = require('fs-extra');
// eslint-disable-next-line security/detect-child-process
const execSync = require('child_process').execSync;
const packageJSON = require('../package.json');
const previousBranch = guessPreviousBranch(packageJSON.version);

// some of us use our personal email addresses to commit...
const KNOWN_EMPLOYEE_EMAILS = [
	'chris@cb1inc.com',
	'ewanharris93@gmail.com',
	'chris.a.williams@gmail.com',
	'jan.vennemann@gmx.net',
	'contact@garymathews.com',
	'yordan.banev@gmail.com',
	'iw@whitfin.io',
	'mukherjee2@users.noreply.github.com',
	'14187093+Sajoha@users.noreply.github.com',
	'Topener@users.noreply.github.com',
	'brenton.house@gmail.com',
	'build@users.noreply.github.com'
];

// others use our company email addresses
const KNOWN_EMPLOYEE_EMAIL_DOMAINS = [
	'axway.com',
	'appcelerator.com'
];

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
 * Try to determine what branch or tag to compare against for determining the commit list and compare url
 *
 * @param {string} version current version
 * @returns {string}
 */
function guessPreviousBranch(version) {
	const result = version.match(/(\d+)\.(\d+)\.(\d+)/);
	const major = parseInt(result[1], 10);
	const minor = parseInt(result[2], 10);
	const patch = parseInt(result[3], 10);
	if (patch === 0) {
		// new major or minor version...

		// new minor version
		if (minor !== 0) { // if 8.1.0, 6.5.0, 7.8.0, etc
			// return previous minor version's maintenance branch
			return `${major}_${minor - 1}_X`; // return 8_0_X, 6_4_X, 7_7_X respectively
		}

		// major version
		// try and find latest maintenance branch of previous major version by asking for git branches with a pattern
		const output = execSync(`git branch --list ${major - 1}_*_X`, { encoding: 'utf8' });
		const lines = output.split(/\r?\n/).map(l => l.trim()).filter(l => l).sort();
		const latestBranch = lines[lines.length - 1];
		return latestBranch;
	}

	// e.g. 8.2.1, 1.2.3, 7.5.2
	return `${major}_${minor}_${patch - 1}_GA`; // try 8_2_0, 1_2_2, 7_5_1?
	// Maybe we can try and confirm the tag actually exists? Because we've been awful about tagging and tag names...
	// ideally it should be like "v1.2.3", but we're doing like '8_1_1_GA' so far
}

function urlToVersion(url) {
	return /-(\d+\.\d+\.\d+)\.zip$/.exec(url)[1]; // eslint-disable-line security/detect-child-process
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

const filteredCommitSHAs = getFilteredShaListing(previousBranch);

module.exports = {
	gitRawCommitsOpts: {
		// 'right-only': true, // --right-only
		// 'cherry-pick': true, // --cherry-pick
		// merges: false, // --no-merges
		// NOTE: This does a 9_0_X..HEAD comparison, but we need a 9_0_X...HEAD comparison with cherry-picks removed
		// We do that above by getting the hashes of that subset and then skip anythign this collects that don't fall into that set
		from: previousBranch,
		// We override to include authorName and authorEmail!
		format: '%B%n-hash-%n%H%n-gitTags-%n%d%n-committerDate-%n%ci%n-authorName-%n%an%n-authorEmail-%n%ae'
	},
	writerOpts: {
		transform: function (commit) {
			// skip commits that may have cherry-picks on both sides
			if (!filteredCommitSHAs.has(commit.hash)) {
				return;
			}

			let discard = true;
			let community = false;
			let breaking = false;

			// Special handling of breaking changes. We gather them in a separate array
			// and place them all together (so discard them from the normal listings)
			commit.notes.forEach(note => {
				note.title = 'BREAKING CHANGES';
				discard = true;
				breaking = true;
			});

			// check authorName/authorEmail against known axway employee list or some whitelist or something to determine community credits?
			if (commit.authorEmail) {
				const emailParts = commit.authorEmail.split('@');
				const domain = emailParts[1];
				if (!KNOWN_EMPLOYEE_EMAIL_DOMAINS.includes(domain)
					&& !KNOWN_EMPLOYEE_EMAILS.includes(commit.authorEmail)
					&& !commit.authorEmail.includes('greenkeeper[bot]')
					&& !commit.authorEmail.includes('dependabot-preview[bot]')) {
					// If this is a noreply github email address, strip it to username so we can link to them
					// if (domain === 'users.noreply.github.com') {
					// 	const usernameParts = emailParts[0].split('+'); // may be ID+username, or just username
					// 	const username = usernameParts[usernameParts.length - 1];
					// 	// TODO: Record username so we can provide link in changelog?
					// }
					// This is a community contribution! Add name to a community credits section
					community = true;
				}
			}

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
			context.previousTag = previousBranch;
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

			// Set End of Support date based on whether this is mjaor or minor/patch.
			// Major means EoS 12 months from now for last major line.
			// Minor/Patch means EoS 6 months from now for last minor
			const eosDate = new Date();
			if (context.isMajor) {
				eosDate.setMonth(eosDate.getMonth() + 12);
				// if isMajor, subtract one from major, add '.x', i.e. 8.0.0 -> '7.x'
				context.eosBranch = `${semver.major(context.version) - 1}.x`;
			} else {
				if (!context.isPatch) { // should be minor!
					// if isMinor, subtract one from minor, add .x, i.e. 8.1.0 -> 8.0.x
					context.eosBranch = `${semver.major(context.version)}.${semver.minor(context.version) - 1}.x`;
					context.patchBranch = `${semver.major(context.version)}.${semver.minor(context.version)}.x`;
					context.majorBranch = `${semver.major(context.version)}.x`;
				} else {
					// Patch, so mark previous patch release as EoS
					context.eosBranch = `${semver.major(context.version)}.${semver.minor(context.version)}.${semver.patch(context.version) - 1}`;
				}
				eosDate.setMonth(eosDate.getMonth() + 6);
			}
			context.eosDate = dateFormat(eosDate, 'yyyy-mm-dd', true);

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

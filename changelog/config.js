'use strict';

const path = require('path');
const fs = require('fs-extra');
// eslint-disable-next-line security/detect-child-process
const execSync = require('child_process').execSync;
const packageJSON = require('../package.json');
const previousBranch = guessPreviousBranch(packageJSON.version);

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

module.exports = {
	gitRawCommitsOpts: {
		from: previousBranch
	},
	writerOpts: {
		transform: function (commit) {
			// flag to not end up discarding breaking changes regardless of commit type
			let discard = true;

			// Don't discard breaking change commits!
			commit.notes.forEach(note => {
				note.title = 'BREAKING CHANGES';
				discard = false;
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
			} else if (commit.type === 'fix') {
				commit.type = 'Bug Fixes';
			} else if (commit.type === 'perf') {
				commit.type = 'Performance Improvements';
			} else if (discard) {
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

			// TODO: Gather up the modules shipped with this version and toss into a variable we can put into the changelog?
			// TODO: Gather up any landed commits by community authors and add to community credits?

			return context;
		},
		commitPartial: fs.readFileSync(path.join(__dirname, 'templates/commit.hbs'), 'utf8'),
		mainTemplate: fs.readFileSync(path.join(__dirname, 'templates/template.hbs'), 'utf8'),
		groupBy: 'type',
		commitGroupsSort: 'title', // FIXME: Sort so features comes before bug fixes, then perf improvements? Can we bake in community credits?
		commitsSort: [ 'scope', 'subject' ],
		noteGroupsSort: 'title',
	}
};

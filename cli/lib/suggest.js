/**
 * Measures the distance between two strings.
 * @param {String} s - The first string
 * @param {String} c - The second string
 * @returns {Number} The distance
 */
export function levenshtein(s, c) {
	s = s.split('');
	c = c.split('');
	const len1 = s.length;
	const len2 = c.length;
	const a = [];
	let i = len1 + 1;
	let j;

	if (!(len1 || len2)) {
		return Math.max(len1, len2);
	}
	for (; i; a[--i] = [ i ]) {
		//
	}
	for (i = len2 + 1; i;) {
		a[0][--i] = i;
	}
	for (i = -1; ++i < len1;) {
		for (j = -1; ++j < len2;) {
			a[i + 1][j + 1] = Math.min(a[i][j + 1] + 1, a[i + 1][j] + 1, a[i][j] + (s[i] != c[j])); // eslint-disable-line eqeqeq
		}
	}
	return a[len1][len2];
}

/**
 * Compares a string to an array of options and suggests close matches based on a given threshold.
 * @param {String} value - The string to compare
 * @param {Array<String>} options - An array of options to compare
 * @param {Function} logger - A function that prints output
 * @param {Number} [threshold=3] - The match threshold
 */
export function suggest(value, options, logger, threshold) {
	value = '' + value;
	threshold = threshold || 3;

	const suggestions = options.filter(opt => {
		return opt.startsWith(value) || levenshtein(value, opt) <= threshold;
	});

	if (suggestions.length) {
		logger('Did you mean this?');
		for (const s of suggestions) {
			logger(`    ${s}`);
		}
		logger();
	}
}

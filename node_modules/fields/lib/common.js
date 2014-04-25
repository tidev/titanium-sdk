var vsprintf = require('sprintf').vsprintf,
	path = require('path'),
	tildeRegExp = /^(~)([\/\\].*)?$/,
	winEnvVarRegExp = /(%([^%]*)%)/g;

exports.mix = function mix(dest) {
	var i = 1,
		l = arguments.length,
		p,
		src;
	dest || (dest = {});
	while (i < l) {
		src = arguments[i++];
		for (p in src) {
			if (src.hasOwnProperty(p)) {
				if (dest.hasOwnProperty(p) && Object.prototype.toString.call(dest[p]) == '[object Object]') {
					exports.mix(dest[p], src[p]);
				} else {
					dest[p] = src[p];
				}
			}
		}
	}
	return dest;
};

exports.__ = function __(obj, message) {
	var strings = obj && obj.i18nStrings || {};
	return vsprintf(strings[message] || message, Array.prototype.slice.call(arguments, 2));
};

exports.resolvePath = function resolvePath() {
	var p = path.join.apply(null, arguments);
	return path.resolve(p.replace(tildeRegExp, function (s, m, n) {
		return process.env[process.platform == 'win32' ? 'USERPROFILE' : 'HOME'] + (n || '/');
	}).replace(winEnvVarRegExp, function (s, m, n) {
		return process.platform == 'win32' && process.env[n] || m;
	}));
};

exports.renderGrid = function renderGrid(margin, items) {
	var margin = (margin || ''),
		longest = items.reduce(function (a, b) { return Math.max(a, b.stripColors.length);}, 0) + 4,
		width = process.stdout.columns || 80,
		i, j, spaces,
		len = items.length,
		cols = Math.floor((width - margin.length) / longest),
		rows = Math.ceil(len / cols),
		buffer = '';

	for (i = 0; i < rows; i++) {
		buffer += margin;
		for (j = 0; j < len; j += rows) {
			if (j + i < len) {
				buffer += items[i + j];
				spaces = longest - items[i + j].stripColors.length;
				if (spaces > 0) {
					buffer += (new Array(spaces)).join(' ');
				}
			}
		}
		buffer += '\n';
	}

	return buffer;
};

exports.levenshtein = function levenshtein(s, c) {
	var len1 = (s = s.split('')).length,
		len2 = (c = c.split('')).length,
		a = [],
		i = len1 + 1,
		j;

	if (!(len1 || len2)) {
		return Math.max(len1, len2);
	}
	for (; i; a[--i] = [i]);
	for (i = len2 + 1; a[0][--i] = i;);
	for (i = -1; ++i < len1;) {
		for (j = -1; ++j < len2;) {
			a[i + 1][j + 1] = Math.min(a[i][j + 1] + 1, a[i + 1][j] + 1, a[i][j] + (s[i] != c[j]));
		}
	}
	return a[len1][len2];
};

exports.suggest = function suggest(obj, value, options, logger, threshold) {
	value = '' + value;
	threshold = threshold || 3;

	var suggestions = options.filter(function (opt) {
		return opt.indexOf(value) == 0 || exports.levenshtein(value, opt) <= threshold;
	});

	if (suggestions.length) {
		logger(exports.__(obj, 'Did you mean this?'));
		suggestions.forEach(function (s) {
			logger('    ' + obj._format(s, 'suggestion'));
		});
	}
};

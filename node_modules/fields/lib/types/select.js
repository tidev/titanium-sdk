var common = require('../common'),
	Prompter = require('../prompter'),
	util = require('util');

module.exports = Select;

function Select(opts) {
	if (!(this instanceof Select)) return new Select(opts);

	Select.super_.call(this);

	// defaults
	this.display = 'list'; // possible values: list, prompt, grid
	this.margin = '  ';
	this.numbered = false;
	this.zeroSkip = false;
	this.autoSelectOne = false;
	this.suggest = false;
	this.suggestThreshold = 3;
	this.relistOnError = false;
	this.options = [];
	this.optionLabel = 'label';
	this.optionValue = 'value';
	this.i18nStrings = {};

	common.mix(this, this._defaults, opts);

	var origValidate = this.validate;

	this.validate = function (value, cb) {
		if (!value && this.zeroSkip) {
			return true;
		}

		var relist = function relist() {
			if (this.relistOnError) {
				if (this.display == 'grid') {
					this._println(common.renderGrid(this.margin, this._prerenderedOptions));
				} else if (this.display == 'list') {
					this._println(this.margin + this._prerenderedOptions.join('\n' + this.margin));
				}
			}
		}.bind(this);

		var checkValues = function checkValues(val) {
			if (!this._values[val]) {
				if (val) {
					var err = common.__(this, 'Invalid selection "%s"', val);
					this._println((this.formatters.error ? this.formatters.error(err) : this._format(err, 'error')) + '\n');
					if (this.suggest) {
						common.suggest(this, val, Object.keys(this._values), this._println, this.suggestThreshold);
					}
				} else {
					var err = common.__(this, 'Please select a valid option');
					this._println((this.formatters.error ? this.formatters.error(err) : this._format(err, 'error')) + '\n');
				}
				return false;
			}
			return true;
		}.bind(this);

		if (this._accelerators[value]) {
			value = this._accelerators[value];
			if (value && typeof value == 'object') {
				value = value[this.optionValue || 'value'];
			}
		}

		if (origValidate) {
			var result = origValidate(value, function (err, val) {
				if (err || !checkValues(val)) {
					relist();
					return cb(true);
				}
				cb(null, val);
			});

			if (result === void 0) return;

			result || relist();
			return result;
		}

		if (!checkValues(value)) {
			relist();
			return false;
		}

		cb(null, value);
	}.bind(this);
}

util.inherits(Select, Prompter);

Select.prototype._prerender = function _prerender(options) {
	var lines = [];
	if (Array.isArray(options)) {
		options.forEach(function (opt, idx) {
			var num = (new Array(3 - ('' + this._num).length)).join(' ') + this._num + ')  ';
			this._num++;
			if (this.formatters.option) {
				lines.push(this.formatters.option.call(this, opt, idx, num));
			} else {
				lines.push(
					(this.numbered ? num : '') +
					this._format(
						typeof opt == 'string'
						? opt
						: (this.optionLabel ? opt[this.optionLabel] : opt.label) || (this.optionValue ? opt[this.optionValue] : opt.value),
					'option')
				);
			}
			this._values[typeof opt == 'string' ? opt.replace(/__(.+?)__/g, '$1') : (this.optionValue ? opt[this.optionValue] : opt.value)] = 1;
		}, this);
	} else if (options && typeof options == 'object') {
		Object.keys(options).forEach(function (group) {
			lines.push(this._format(group, 'group'));
			lines = lines.concat(this._prerender(options[group]));
		}, this);
	}
	return lines;
};

Select.prototype._complete = function _complete(value, callback) {
	var matches = [],
		diff = [],
		shortest = -1,
		i, j, same;

	Object.keys(this._values).forEach(function (v) {
		if (v.indexOf(value) == 0) {
			matches.push(v);
			var s = v.substring(value.length);
			if (s.length) {
				if (shortest == -1) {
					shortest = s.length;
				} else {
					shortest = Math.min(shortest, s.length);
				}
				diff.push(s);
			}
		}
	});

	// if no matches and we are permitted to ignore case, try again
	if (matches.length == 0 && this.completeIgnoreCase) {
		var lvalue = value.toLowerCase();
		Object.keys(this._values).forEach(function (v) {
			if (v.toLowerCase().indexOf(lvalue) == 0) {
				matches.push(v);
				value = v.substring(0, lvalue.length);
				var s = v.substring(lvalue.length);
				if (s.length) {
					if (shortest == -1) {
						shortest = s.length;
					} else {
						shortest = Math.min(shortest, s.length);
					}
					diff.push(s);
				}
			}
		});
	}

	if (matches.length == 1) {
		// only 1 match, so just return it now
		callback(matches[0]);
	} else if (diff.length > 1) {
		// auto complete as much as we can
		for (i = 0; i < shortest; i++) {
			same = true;
			for (j = 1; j < diff.length; j++) {
				if (diff[j][i] != diff[j-1][i]) {
					same = false;
					break;
				}
			}
			if (same) {
				value += diff[0][i]; // if char at "i" is the same, then just take it from the first string
			} else {
				break;
			}
		}
		callback(value, matches);
	} else {
		callback(value);
	}
};

Select.prototype._getByNumber = function _getByNumber(value) {
	if (this.numbered) {
		// did they enter a number?
		var num = parseInt(value);
		if (!isNaN(num) && ''+num === value) {
			if (num >= 1 && num < this._num) {
				return Object.keys(this._values)[num - 1] || value;
			} else if (num == 0 && this.zeroSkip) {
				return '';
			}
		}
	}
	return value;
};

Select.prototype.prompt = function prompt(callback) {
	this.emit('pre-prompt', this);
	this._values = {};
	this._num = 1;
	this._prerenderedOptions = this._prerender(this.options);

	var numOpts = Object.keys(this._values).length;
	if (numOpts == 0) {
		return callback(null, null);
	} else if (this.autoSelectOne && numOpts == 1) {
		return callback(null, Object.keys(this._values).shift());
	}

	var a = this._accelerators = {},
		re = /__(.+?)__/;
	if (Array.isArray(this.options)) {
		this.options.forEach(function (opt, i) {
			var m = String(opt && typeof opt == 'object' ? opt[this.optionLabel || (opt.label ? 'label' : this.optionValue || 'value')] : opt).match(re);
			if (m) {
				if (typeof opt == 'string') {
					a[m[1]] = opt.replace(re, m[1]);
					this.options[i] = opt.replace(re, m[1]);
				} else {
					a[m[1]] = opt;
				}
			}
		}, this);
	} else if (this.options && typeof this.options == 'object') {
		Object.keys(this.options).forEach(function (group) {
			this.options[group].forEach(function (opt, i) {
				var m = String(opt && typeof opt == 'object' ? opt[this.optionLabel || (opt.label ? 'label' : this.optionValue || 'value')] : opt).match(re);
				if (m) {
					if (typeof opt == 'string') {
						a[m[1]] = opt.replace(re, m[1]);
						this.options[group][i] = opt.replace(re, m[1]);
					} else {
						a[m[1]] = opt;
					}
				}
			}, this);
		}, this);
	}

	var margin = (this.margin || '');

	this.title && this._println(this.formatters.title ? this.formatters.title(this) : this._format('title'));
	this.desc && this._println(this.formatters.desc ? this.formatters.desc(this) : this._format('desc'));

	if (this.display == 'prompt') {
		this.promptValues = '';
		Object.keys(this._values).forEach(function (value, idx) {
			this.promptValues += (idx ? this.promptValuesSeparator : '') + value;
		}, this);
	} else if (this.display == 'grid') {
		this._println(common.renderGrid(margin, this._prerenderedOptions));
	} else if (this.display == 'list') {
		this._println(margin + this._prerenderedOptions.join('\n' + margin));
	}

	this._get(callback);
};
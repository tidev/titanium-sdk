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
	this.ignoreCase = false;
	this.suggest = false;
	this.suggestThreshold = 3;
	this.relistOnError = false;
	this.options = [];
	this.optionLabel = 'label';
	this.optionValue = 'value';
	this.i18nStrings = {};

	common.mix(this, this._defaults, opts);
}

util.inherits(Select, Prompter);

Select.prototype._validate = function _validate(value, cb) {
	if (value === 0 && this.numbered && this.zeroSkip) {
		return true;
	}

	var self = this;

	function relist() {
		if (self.relistOnError) {
			if (self.display === 'grid') {
				self._println(common.renderGrid(self.margin, self._prerenderedOptions));
			} else if (self.display === 'list') {
				self._println(self.margin + self._prerenderedOptions.join('\n' + self.margin));
			}
		}
	}

	function checkValues(val) {
		var ival = self.ignoreCase && typeof val === 'string' ? val.toLowerCase() : val;

		if (self._distinctValues.hasOwnProperty(ival)) {
			value = self._distinctValues[ival];
		} else {
			if (ival !== void 0 && ival !== null) {
				var err = common.__(self, 'Invalid selection "%s"', val);
				self._println((self.formatters.error ? self.formatters.error(err) : self._format(err, 'error')) + '\n');
				if (self.suggest) {
					common.suggest(self, val, Object.keys(self._distinctValues), self._println, self.suggestThreshold);
				}
			} else {
				var err = common.__(self, 'Please select a valid option');
				self._println((self.formatters.error ? self.formatters.error(err) : self._format(err, 'error')) + '\n');
			}
			return false;
		}

		return true;
	}

	if (this._accelerators[value]) {
		value = this._accelerators[value];
		if (value && typeof value === 'object') {
			value = value[this.optionValue || 'value'];
		}
	}

	if (this.validate) {
		var result = this.validate(value, function (err, val) {
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
};

Select.prototype._complete = function _complete(value, callback) {
	var matches = [],
		diff = [],
		shortest = -1,
		i, j, same;

	Object.keys(this._distinctValues).forEach(function (v) {
		if (v.indexOf(value) === 0) {
			matches.push(v);
			var s = v.substring(value.length);
			if (s.length) {
				if (shortest === -1) {
					shortest = s.length;
				} else {
					shortest = Math.min(shortest, s.length);
				}
				diff.push(s);
			}
		}
	});

	// if no matches and we are permitted to ignore case, try again
	if (matches.length === 0 && this.completeIgnoreCase) {
		var lvalue = value.toLowerCase();
		Object.keys(this._distinctValues).forEach(function (v) {
			if (v.toLowerCase().indexOf(lvalue) === 0) {
				matches.push(v);
				value = v.substring(0, lvalue.length);
				var s = v.substring(lvalue.length);
				if (s.length) {
					if (shortest === -1) {
						shortest = s.length;
					} else {
						shortest = Math.min(shortest, s.length);
					}
					diff.push(s);
				}
			}
		});
	}

	if (matches.length === 1) {
		// only 1 match, so just return it now
		callback(matches[0]);
	} else if (diff.length > 1) {
		// auto complete as much as we can
		for (i = 0; i < shortest; i++) {
			same = true;
			for (j = 1; j < diff.length; j++) {
				if (diff[j][i] !== diff[j-1][i]) {
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
			if (num === 0 && this.zeroSkip) {
				return '';
			}
			if (num >= 1 && num <= this._allValues.length) {
				return this._allValues[num - 1];
			}
		}
	}
	return value;
};

/**
 * Renders the select list and prompts for a selection.
 *
 * @param {Function} callback - A function to call after prompting with the selected item.
 */
Select.prototype.prompt = function prompt(callback) {
	var self = this;

	this.emit('pre-prompt', this);
	this._distinctValues = {};
	this._prerenderedOptions = [];
	this._allValues = [];

	var counter = 1;

	(function prepareOptions(options) {
		if (Array.isArray(options)) {
			options.forEach(function (opt, idx) {
				var num = (new Array(3 - ('' + counter).length)).join(' ') + counter + ')  ',
					label = typeof opt === 'string' ? opt : (self.optionLabel ? opt[self.optionLabel] : opt.label) || (self.optionValue ? opt[self.optionValue] : opt.value),
					val = typeof opt === 'string' ? opt.replace(/__(.+?)__/g, '$1') : (self.optionValue ? opt[self.optionValue] : opt.value);

				counter++;
				self._allValues.push(val);

				if (self.formatters.option) {
					self._prerenderedOptions.push(self.formatters.option.call(self, opt, idx, num));
				} else {
					self._prerenderedOptions.push(
						(self.numbered ? num : '') +
						self._format(label, 'option')
					);
				}

				if (Array.isArray(self.complete)) {
					self.complete.forEach(function (key) {
						if (opt.hasOwnProperty(key)) {
							self._distinctValues[self.ignoreCase && typeof opt[key] === 'string' ? opt[key].toLowerCase() : opt[key]] = val;
						}
					});
				} else {
					self._distinctValues[self.ignoreCase && typeof val === 'string' ? val.toLowerCase() : val] = val;
				}
			});
		} else if (options && typeof options === 'object') {
			Object.keys(options).forEach(function (group) {
				self._prerenderedOptions.push(self._format(group, 'group'));
				prepareOptions(options[group]);
			});
		}
	})(this.options);

	var numOpts = Object.keys(this._allValues).length;
	if (numOpts === 0) {
		return callback(null, null);

	} else if (this.autoSelectOne && numOpts === 1) {
		// there's only one option, so select it
		var value = Object.keys(this._distinctValues).shift();

		function check(val) {
			var ival = self.ignoreCase && typeof val === 'string' ? val.toLowerCase() : val;

			if (self._distinctValues.hasOwnProperty(ival)) {
				callback(null, self._distinctValues[ival]);
			} else if (ival !== void 0 && ival !== null) {
				callback(new Error(common.__(self, 'Invalid selection "%s"', val)));
			} else {
				callback(new Error(common.__(self, 'Please select a valid option')));
			}
		}

		if (typeof this.validate === 'function') {

			var result = this.validate(value, function (err, val) {
				if (err) {
					callback(err);
				} else {
					check(val);
				}
			});

			// if result is undefined, then we assume they are going to call the callback
			if (result === void 0) return;

			if (result === false) {
				callback(true);
			} else {
				callback(null, value);
			}
		} else {
			check(value);
		}
		return;
	}

	var a = this._accelerators = {},
		re = /__(.+?)__/;

	if (Array.isArray(this.options)) {
		this.options.forEach(function (opt, i) {
			var m = String(opt && typeof opt === 'object' ? opt[this.optionLabel || (opt.label ? 'label' : this.optionValue || 'value')] : opt).match(re);
			if (m) {
				if (typeof opt === 'string') {
					a[m[1]] = opt.replace(re, m[1]);
					this.options[i] = opt.replace(re, m[1]);
				} else {
					a[m[1]] = opt;
				}
			}
		}, this);
	} else if (this.options && typeof this.options === 'object') {
		Object.keys(this.options).forEach(function (group) {
			this.options[group].forEach(function (opt, i) {
				var m = String(opt && typeof opt === 'object' ? opt[this.optionLabel || (opt.label ? 'label' : this.optionValue || 'value')] : opt).match(re);
				if (m) {
					if (typeof opt === 'string') {
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

	if (this.display === 'prompt') {
		this.promptValues = '';
		Object.keys(this._distinctValues).forEach(function (value, idx) {
			this.promptValues += (idx ? this.promptValuesSeparator : '') + value;
		}, this);
	} else if (this.display === 'grid') {
		this._println(common.renderGrid(margin, this._prerenderedOptions));
	} else if (this.display === 'list') {
		this._println(margin + this._prerenderedOptions.join('\n' + margin));
	}

	this._get(callback);
};

# Fields

Fields is a small library that provides a handful of useful input fields for use
at the command line. Each field type supports both an object-oriented and
chainable method-based API.

[![NPM](https://nodei.co/npm/fields.png?downloads=true&stars=true)](https://nodei.co/npm/fields/)

# Installation

    npm install fields

# Features

* Tab completion for File and Select fields
* Password masks
* Titles, descriptions, prompt labels
* Custom renderers and validation handler support
* Fully customizable appearance
* Command history
* Batch field prompting including flow control
* Support for select field option accelerators

# Field Types

## Text

Simple prompt for capturing a string of text. Also supports password masks and history.

![Text field](https://www.evernote.com/shard/s75/sh/0ff002b2-7b15-4442-8a3a-afb806dac932/9a9d355870fb90099c042dac4f5cf12d/deep/0/Screenshot%207/18/13%2010:02%20PM.jpg)

## File

Prompt for a specific file or directory. Supports tab completion.

![File field](https://www.evernote.com/shard/s75/sh/f75b3e0a-ee8b-46bc-b0f7-1b93339de3ad/f53665b083f0a3cbcab0358a59a44ad1/deep/0/Screenshot%207/18/13%209:58%20PM.jpg)

## Select list

Displays a list of options which a single item can be selected. Supports tab
completion, numbered options, and setting the display method.

![Select field](https://www.evernote.com/shard/s75/sh/872fdef6-b11a-4426-a6e9-ef07bd80a98e/801ffb85cd9d9247bee6bf33dcb0a940/deep/0/Screenshot%207/18/13%2010:09%20PM.jpg)

## Set

Group multiple fields into a single "set" and prompts for each field. Supports
skipping fields in the set.

![Set field](https://www.evernote.com/shard/s75/sh/c1f725c2-c261-4a43-93ca-156899c18371/92acf90edb7a7a2775322d6c9595d506/deep/0/Screenshot%207/18/13%2010:12%20PM.jpg)

# Getting Started

Start by requiring the fields module:

```js
var fields = require('fields');
```

# Global Settings

## fields.setup(opts)

Sets default settings.

* `{object}` `opts` Contains settings that will override the default values

Example:

```js
fields.setup({
	colors: false
});
```

### Available Default Settings

`{boolean}` `colors`

* Enables colors.
* Scope: applies to all field types
* Default: `true`

`{string}` `separator`

* The separator between the promptLabel and the input.
* Scope: applies to all field types
* Default: `'> '`

`{string}` `defaultLeft`

* When a default value is set, this string is printed to the left of the
  default value.
* Scope: applies to `File`, `Select`, and `Text`
* Default: `'['`

`{string}` `defaultRight`

* When a default value is set, this string is printed to the right of the
  default value.
* Scope: applies to `File`, `Select`, and `Text`
* Default: `']'`

`{string}` `promptValuesLeft`

* When displaying a list of values in the prompt, this string is printed to
  the left of the list of values.
* Scope: applies to `Select`, but will work with `File` and `Text`
* Default: `'('`

`{string}` `promptValuesSeparator`

* When displaying a list of values in the prompt, this string is printed
  between each value.
* Scope: applies to `Select`, but will work with `File` and `Text`
* Default: `'|'`

`{string}` `promptValuesRight`

* When displaying a list of values in the prompt, this string is printed to
  the right of the list of values.
* Scope: applies to `Select`, but will work with `File` and `Text`
* Default: `')'`

`{string}` `mask`

* The character to be rendered when prompting for a password.
* Scope: applies to `Text` when `password` = `true`
* Default: `'*'`

`{string}` `fieldSeparator`

* The string to be displayed between fields in a `Set`.
* Scope: applies to `Set`
* Default: `'\n'`

`{object}` `style`

* An object containing one or more style classes where the value is a color
  or style or an array containg a color and one or more styles. Values may
  also be `null`.
* Properties:
	* `default` (default value: `'cyan'`)
	* `title` (default value: `'magenta'`)
	* `promptLabel` (default value: `'bold'`)
	* `promptValues` (default value: `null`)
	* `desc` (default value: `'grey'`)
	* `mask` (default value: `'magenta'`)
	* `group` (default value: `'grey'`)
	* `error` (default value: `'red'`)
	* `suggestion` (default value: `'cyan'`)
	* `option` (default value: `'cyan'`)
	* `accelerator` (default value `['underline', 'bold', 'cyan']`)
* Colors:
	* `'red'`
	* `'yellow'`
	* `'green'`
	* `'blue'`
	* `'cyan'`
	* `'magenta'`
	* `'black'`
	* `'grey'`
	* `'white'`
* Styles:
	* `'bold'`
	* `'underline'`
	* `'italic'`
	* `'inverse'`
	* NOTE: some styles, such as `italic`, may not work in all environments
	  and styles such as `white` or `black` may conflict with the background
	  color of the user's terminal.

`{boolean}` `repromptOnError`

* If the field has a `validate()` function, validation fails, and
  `repromptOnError` is `true` (default), then it will reprompt for the value
  again. If `repromptOnError` is false, then it will stop prompting. This is
  useful when you have a `Set` and you need to prompt for multiple values, then
  possibly return to a previous field if validation fails. For example, you
  prompt for a username and password, but authentication fails, you may want to
  re-prompt for the username again.
* Scope: applies to `File`, `Select`, and `Text`
* Default: `true`

# fields.Text(opts)

Creates a new Text field.

* `{object}` `opts` Text field options.

	* Text field specific options:

		* `{object}` `opts.formatters` An object of specific formatting functions.

			* `{function}` `opts.formatters.desc(string)`

			  Custom field description formatter.

			* `{function}` `opts.formatters.error(Error|string)`

			  Error message formatter.

			* `{function}` `opts.formatters.title(string)`

			  Custom field title formatter.

	* Standard options:

		* `{boolean}` `opts.colors`

		  Enables text being rendered with color. Default value is `true`.

		* `{string}` `opts.default`

		  The default value. Returned when the user enters an empty value at the
		  prompt.

		* `{string}` `opts.defaultLeft`

		  A string displayed before the default value in the prompt. Default value is `'['`.

		* `{string}` `opts.defaultRight`

		  A string displayed after the default value in the prompt. Default value is `']'`.

		* `{string}` `opts.desc`

		  The description to print below the title, but above the prompt.

		* `{boolean}` `opts.hidden`

		  When true, the value is still prompted, but it's not apart of the results.
		  Useful for decisions in a `Set`.

		* `{string}` `opts.mask`

		  The character to be rendered when entering a password. The mask must be 1
		  character. Default value is `'*'`.

		* `{function}` `opts.next(err, value, callback)`

		  When this field is being prompted in a `Set`, the `next()` function is
		  called after prompting  and `validate()` has completed to tell the `Set`
		  which field to visit next.

		  If `validate()` fails and `repromptOnError` == `true`, then `next()` is not
		  called since the field will continue to re-prompt until `validate()` passes.

		  `next()` may return the name or index of the next field or call the supplied
		  `callback()` with the name or index of the next field to visit.

		  If `next()` returns nothing or `undefined`, it will assume you are planning
		  on calling the supplied `callback` function.

		  If `next()` returns `null`, then the `Set` will proceed to the next field.

		  If `next()` returns `false`, then it will tell the `Set` to stop prompting.

		* `{boolean}` `opts.password`

		  Treat input as a secret.

		* `{string}` `opts.promptLabel`

		  The label to display before prompt.

		* `{array<string>}` `opts.promptValues`

		  The values to print between the `promptLabel` and the prompt input.

		* `{string}` `opts.promptValuesLeft`

		  A string displayed before the `promptValues`. Default value is `'('`.

		* `{string}` `opts.promptValuesRight`

		  A string displayed after the `promptValues`. Default value is `')'`.

		* `{string}` `opts.promptValuesSeparator`

		  A string used to separate the prompt values. Default value is `'|'`.

		* `{boolean}` `opts.repromptOnError`

		  If the field has a `validate()` function, validation fails, and
		  `repromptOnError` is `true` (default), then it will reprompt for the value
		  again.

		  If `repromptOnError` is false, then it will stop prompting. This is useful
		  when you have a `Set` and you need to prompt for multiple values, then
		  possibly return to a previous field if validation fails.

		  For example, you prompt for a username and password, but authentication
		  fails, you may want to re-prompt for the username again.

		  Default value is `true`.

		* `{string}` `opts.separator`

		  A string displayed after the prompt, but before the prompt input. Default
		  value is `': '`.

		* `{string}` `opts.title`

		  The title to print above the prompt.

		* `{boolean}` `opts.trim`

		  Trim the input after entered. Default value is `true`.

		* `{function}` `opts.validate(value, callback(err, value), field)`

		  A function to be called when a value is submitted. The `validate()`
		  function is passed in the `value` and a `callback`.

		  If the `validate()` function returns `true`, validation passes.

		  If it returns `false`, validation fails.

		  If it returns `undefined`, then it will wait for the `callback()` parameter
		  to be called. The `callback(err, value)` function MUST pass the `value`
		  back. This allows the `callback()` to not only validate, but modify the
		  value.

Returns a `Text` field instance with the following properties:

* `{function}` `prompt(callback)`

	* `{function}` `callback(err, value)`

	  A function that is called when prompting has completed.

* `{Set}` `set`

  If the field is apart of a `Set`, then this property will reference the set,
  otherwise `set` will be `null`.

Events:

* `pre-prompt`

  Emitted before the current field is prompted.

  * `{object}` `field` The current field

* `post-prompt`

  Emitted after the current field has been prompted.

  * `{object}` `field` The current field
  * `{anything}` `err` The error if something failed
  * `{string}` `result` The result after the prompting

Object-oriented example:

```js
var nameField = new fields.Text({
	title: 'We would like to know your name',
	promptLabel: 'What is your name?'
});

nameField.prompt(function (err, value) {
	if (err) {
		console.error('There was an error!\n' + err);
	} else {
		console.log('You entered ' + value);
	}
});
```

Chainable function example:

```
var ageField = fields.text({
	title: 'What is your age?',
	description: 'We promise not to tell anyone',
	validate: function (value) {
		return /^\d+$/.test(value);
	}
});

ageField.prompt(function (err, value) {
	if (err) {
		console.error('There was an error!\n' + err);
	} else {
		console.log('You entered ' + value);
	}
});
```

Callback validation example:

```
fields.text({
	title: 'What is your favorite food?'
	validate: function (value, callback) {
		callback(null, value.toLowerCase());
	}
}).prompt(function (err, value) {
	if (err) {
		console.error('There was an error!\n' + err);
	} else {
		console.log('You entered ' + value);
	}
});
```

# fields.File(opts)

Creates a new File field.

* `{object}` `opts` File field options.

	* File field specific options:

		* `{object}` `opts.formatters`

		  An object of specific formatting functions.

			* `{function}` `opts.formatters.desc(string)`

			  Custom field description formatter.

			* `{function}` `opts.formatters.error(Error|string)`

			  Error message formatter.

			* `{function}` `opts.formatters.title(string)`

			  Custom field title formatter.

		* `{regexp}` `opts.ignoreDirs`

		  A regular expression of directory names to ignore when autocompleting.

		* `{regexp}` `opts.ignoreFiles`

		  A regular expression of filenames to ignore when autocompleting.

		* `{boolean}` `opts.showHidden`

		  If true, will display files beginning with a '.' in the autocomplete
		  results. Defaults to `true`.

	* Autocomplete options:

		* `{boolean}` `opts.complete`

		  If true, will autocomplete the current entry when the <tab> key is entered.
		  Default value is `false`.

	* Standard options:

		* `{boolean}` `opts.colors`

		  Enables text being rendered with color. Default value is `true`.

		* `{string}` `opts.default`

		  The default value. Returned when the user enters an empty value at the prompt.

		* `{string}` `opts.defaultLeft`

		  A string displayed before the default value in the prompt. Default value is `'['`.

		* `{string}` `opts.defaultRight`

		  A string displayed after the default value in the prompt. Default value is `']'`.

		* `{string}` `opts.desc`

		  The description to print below the title, but above the prompt.

		* `{boolean}` `opts.hidden`

		  When true, the value is still prompted, but it's not apart of the results.
		  Useful for decisions in a `Set`.

		* `{string}` `opts.mask`

		  The character to be rendered when entering a password. The mask must be 1
		  character. Default value is `'*'`.

		* `{function}` `opts.next(err, value, callback)`

		  When this field is being prompted in a `Set`, the `next()` function is
		  called after prompting  and `validate()` has completed to tell the `Set`
		  which field to visit next.

		  If `validate()` fails and `repromptOnError` == `true`, then `next()` is not
		  called since the field will continue to re-prompt until `validate()` passes.

		  `next()` may return the name or index of the next field or call the supplied
		  `callback()` with the name or index of the next field to visit.

		  If `next()` returns nothing or `undefined`, it will assume you are planning
		  on calling the supplied `callback` function.

		  If `next()` returns `null`, then the `Set` will proceed to the next field.

		  If `next()` returns `false`, then it will tell the `Set` to stop prompting.

		* `{boolean}` `opts.password`

		  Treat input as a secret.

		* `{string}` `opts.promptLabel`

		  The label to display before prompt.

		* `{array<string>}` `opts.promptValues`

		  The values to print between the `promptLabel` and the prompt input.

		* `{string}` `opts.promptValuesLeft`

		  A string displayed before the `promptValues`. Default value is `'('`.

		* `{string}` `opts.promptValuesRight`

		  A string displayed after the `promptValues`. Default value is `')'`.

		* `{string}` `opts.promptValuesSeparator`

		  A string used to separate the prompt values. Default value is `'|'`.

		* `{boolean}` `opts.repromptOnError`

		  If the field has a `validate()` function, validation fails, and
		  `repromptOnError` is `true` (default), then it will reprompt for the value
		  again.

		  If `repromptOnError` is false, then it will stop prompting. This is useful
		  when you have a `Set` and you need to prompt for multiple values, then
		  possibly return to a previous field if validation fails.

		  For example, you prompt for a username and password, but authentication
		  fails, you may want to re-prompt for the username again.

		  Default value is `true`.

		* `{string}` `opts.separator`

		  A string displayed after the prompt, but before the prompt input. Default
		  value is `': '`.

		* `{string}` `opts.title`

		  The title to print above the prompt.

		* `{boolean}` `opts.trim`

		  Trim the input after entered. Default value is `true`.

		* `{function}` `opts.validate(value, callback(err, value), field)`

		  A function to be called when a value is submitted. The `validate()`
		  function is passed in the `value` and a `callback`.

		  If the `validate()` function returns `true`, validation passes.

		  If it returns `false`, validation fails.

		  If it returns `undefined`, then it will wait for the `callback()` parameter
		  to be called. The `callback(err, value)` function MUST pass the `value`
		  back. This allows the `callback()` to not only validate, but modify the
		  value.

Returns a `File` field instance with the following properties:

* `{function}` `prompt(callback)`

	* `{function}` `callback(err, value)`

	  A function that is called when prompting has completed.

* `{Set}` `set`

  If the field is apart of a `Set`, then this property will reference the set,
  otherwise `set` will be `null`.

Events:

* `pre-prompt`

  Emitted before the current field is prompted.

  * `{object}` `field` The current field

* `post-prompt`

  Emitted after the current field has been prompted.

  * `{object}` `field` The current field
  * `{anything}` `err` The error if something failed
  * `{string}` `result` The result after the prompting

Example:

```
fields.file({
	title: 'Enter the project directory',
	desc: 'Any directory will do',
	complete: true,
	showHidden: false,
	ignoreDirs: /^(\.svn|\.git|\.hg)$'/,
	ignoreFiles: /^(\.gitignore|\.npmignore|\.cvsignore|\.DS_store|\._\*)$/
}).prompt(function (err, value) {
	if (err) {
		console.error('There was an error!\n' + err);
	} else {
		console.log('You entered ' + value);
	}
});
```

# fields.Select(opts)

Creates a new Select field.

* `{object}` `opts` Select field options.

	* Select field specific options:

		* `{boolean}` `opts.autoSelectOne`

		  If `true` and the `options` array contains a single entry, then it will skip
		  the prompting and immediately call the callback. Default value is `false`.

		* `{string}` `opts.display`

		  Controls how autocomplete results are
		  printed. Possible values are `'grid'`, `'list'`, and `'prompt'`.
		  Default value is `'list'`.

		* `{object}` `opts.formatters`

		  An object of specific formatting functions.

			* `{function}` `opts.formatters.desc(string)`

			  Custom field description formatter.

			* `{function}` `opts.formatters.error(Error|string)`

			  Error message formatter.

			* `{function}` `opts.formatters.option(string)`

			  Custom select list option formatter.

			* `{function}` `opts.formatters.title(string)`

			  Custom field title formatter.

		* `{string}` `opts.margin`

		  A string to print in the left margin for each item being rendered. Default
		  value is two spaces.

		* `{boolean}` `opts.numbered`

		  If `true`, prints numbers for each list option in which the user can select
		  the item by entering the number. Default value is `false`.

		* `{array<object>}` `opts.options`

		  An array of options to display. Each option should have a label and a value.
		  You can name these properties whatever you'd like as long as you specify
		  their name using the `optionLabel` and `optionValue` options.

		* `{string}` `opts.optionLabel`

		  The name of the key in each option's object that contains the label to print
		  for the option. Default value is `'label'`.

		* `{string}` `opts.optionValue`

		  The name of the key in each option's object that contains the value that is
		  submitted if the option is selected. Default value is `'value'`.

		* `{boolean}` `opts.relistOnError`

		  If `true`, after a invalid option is selected, then it will re-display all
		  available options. Default value is `false`.

		* `{object}` `opts.i18nStrings`

		  An object containing internationalized strings. There currently are only two
		  strings that would need to be translated:

			* `'Invalid selection "%s"'`

			* `'Please select a valid option'`

		* `{boolean}` `opts.suggest`

		  If `true`, it will display a list of possible suggestions that closest match
		  the submitted value. This uses the levenshtein algorithm to compare the
		  value with possible values. Default value is `false`.

		* `{number}` `opts.suggestThreshold`

		  A threshold for the levenshtein algorithm. Default value is `3`. You may
		  want to use `2` if matching short strings.

		* `{boolean}` `opts.zeroSkip`

		  If `true` and `numbered` is `true`, then allows the user to enter zero to
		  select nothing. Default value is `false`.

	* Autocomplete options:

		* `{boolean}` `opts.complete`

		  If true, will autocomplete the current entry when the <tab> key is entered.
		  Default value is `false`.

		* `{boolean}` `opts.completeIgnoreCase`

		  If true, will ignore case when finding matches. Default value is `false`.

	* Standard options:

		* `{boolean}` `opts.colors`

		  Enables text being rendered with color. Default value is `true`.

		* `{string}` `opts.default`

		  The default value. Returned when the user enters an empty value at the
		  prompt.

		* `{string}` `opts.defaultLeft`

		  A string displayed before the default value in the prompt. Default value
		  is `'['`.

		* `{string}` `opts.defaultRight`

		  A string displayed after the default value in the prompt. Default value
		  is `']'`.

		* `{string}` `opts.desc`

		  The description to print below the title, but above the prompt.

		* `{boolean}` `opts.hidden`

		  When true, the value is still prompted, but it's not apart of the results.
		  Useful for decisions in a `Set`.

		* `{string}` `opts.mask`

		  The character to be rendered when entering a password. The mask must be 1
		  character. Default value is `'*'`.

		* `{function}` `opts.next(err, value, callback)`

		  When this field is being prompted in a `Set`, the `next()` function is
		  called after prompting  and `validate()` has completed to tell the `Set`
		  which field to visit next.

		  If `validate()` fails and `repromptOnError` == `true`, then `next()` is not
		  called since the field will continue to re-prompt until `validate()` passes.

		  `next()` may return the name or index of the next field or call the supplied
		  `callback()` with the name or index of the next field to visit.

		  If `next()` returns nothing or `undefined`, it will assume you are planning
		  on calling the supplied `callback` function.

		  If `next()` returns `null`, then the `Set` will proceed to the next field.

		  If `next()` returns `false`, then it will tell the `Set` to stop prompting.

		* `{boolean}` `opts.password`

		  Treat input as a secret.

		* `{string}` `opts.promptLabel`

		  The label to display before prompt.

		* `{array<string>}` `opts.promptValues`

		  The values to print between the `promptLabel` and the prompt input.

		* `{string}` `opts.promptValuesLeft`

		  A string displayed before the `promptValues`. Default value is `'('`.

		* `{string}` `opts.promptValuesRight`

		  A string displayed after the `promptValues`. Default value is `')'`.

		* `{string}` `opts.promptValuesSeparator`

		  A string used to separate the prompt values. Default value is `'|'`.

		* `{boolean}` `opts.repromptOnError`

		  If the field has a `validate()` function, validation fails, and
		  `repromptOnError` is `true` (default), then it will reprompt for the value
		  again.

		  If `repromptOnError` is false, then it will stop prompting. This is useful
		  when you have a `Set` and you need to prompt for multiple values, then
		  possibly return to a previous field if validation fails.

		  For example, you prompt for a username and password, but authentication
		  fails, you may want to re-prompt for the username again.

		  Default value is `true`.

		* `{string}` `opts.separator`

		  A string displayed after the prompt, but before the prompt input. Default
		  value is `': '`.

		* `{string}` `opts.title`

		  The title to print above the prompt.

		* `{boolean}` `opts.trim`

		  Trim the input after entered. Default value is `true`.

		* `{function}` `opts.validate(value, callback(err, value), field)`

		  A function to be called when a value is submitted. The `validate()`
		  function is passed in the `value` and a `callback`.

		  If the `validate()` function returns `true`, validation passes.

		  If it returns `false`, validation fails.

		  If it returns `undefined`, then it will wait for the `callback()` parameter
		  to be called. The `callback(err, value)` function MUST pass the `value`
		  back. This allows the `callback()` to not only validate, but modify the
		  value.

Returns a `Select` field instance with the following properties:

* `{function}` `prompt(callback)`

	* `{function}` `callback(err, value)`

	  A function that is called when prompting has completed.

* `{Set}` `set`

  If the field is apart of a `Set`, then this property will reference the set,
  otherwise `set` will be `null`.

If an option label contains double underscores that wrap a character like
`some__t__hing`, then `t` will become an accelerator that automatically maps `t`
with `something`. Use the `accelerator` style to style it.

Events:

* `pre-prompt`

  Emitted before the current field is prompted.

  * `{object}` `field` The current field

* `post-prompt`

  Emitted after the current field has been prompted.

  * `{object}` `field` The current field
  * `{anything}` `err` The error if something failed
  * `{string}` `result` The result after the prompting

Simple example:

```
var list = new fields.Select({
	title: 'What is your favorite milkshake?',
	options: [
		'__v__anilla',
		'stra__w__berry',
		'cho__c__olate'
	],
	complete: true,
	suggest: true
});

list.prompt(function (err, value) {
	if (err) {
		console.error('There was an error!\n' + err);
	} else {
		console.log('Your favorite milkshake is ' + value + '. Yum!');
	}
});
```

Slightly more complex example:

```
fields.select({
	title: 'Select a UUID by number or name',
	formatters: {
		option: function (opt, idx, num) {
			return '    ' + num + opt.value.cyan + '  ' + opt.name;
		}
	},
	numbered: true,
	relistOnError: true,
	complete: true,
	suggest: true,
	options: {
		'Available UUIDs:': [
			{ name: 'uuid 1', value: '43C5E7DE-F6BB-4AEF-98F0-0A33990EA280' },
			{ name: 'uuid 2', value: '4F562E96-C933-4367-B6BD-89CA7D6EE400' },
			{ name: 'uuid 3', value: '31D3AC10-99F4-43E1-997B-980E70EC706B' },
			{ name: 'uuid 4', value: 'E1512AE0-FEBB-43A2-9C9C-E1D2F4D6C51F' },
			{ name: 'uuid 5', value: 'F624D6BA-5FF3-4E48-B9F2-BC7DD1A8EA97' },
			{ name: 'uuid 6', value: '3C12C8D9-C05F-4834-BA7E-9C55CB8C9287' },
			{ name: 'uuid 7', value: 'BB91EDBF-2A97-4227-B5B2-5943BAB30304' },
			{ name: 'uuid 8', value: '204C6E4A-FA9C-48BB-9D84-709A10A690AB' },
			{ name: 'uuid 9', value: '05282F35-42BB-40F3-8C20-3EC1739AB414' },
			{ name: 'uuid 10', value: '5EC586D9-7E2B-4F55-834D-CD8199DD92B8' },
			{ name: 'uuid 11', value: 'A4BD1980-8C4B-4DBB-8FBE-5A52E36DFA63' },
			{ name: 'uuid 12', value: '99C49052-E280-48D3-B881-E8112B7DFCF1' },
			{ name: 'uuid 13', value: 'A057301B-B38D-40B6-A6A4-B582AE5EAABE' },
			{ name: 'uuid 14', value: 'D39B019B-3EF0-4BCA-A1E9-FC2F5063097F' },
			{ name: 'uuid 15', value: 'C9A11E0C-5FF4-4B55-890F-F7715194CAB3' },
			{ name: 'uuid 16', value: 'B1E31DD0-8968-4A32-B210-A0558302F65B' }
		]
	}
}).prompt(function (err, value) {
	if (err) {
		console.error('There was an error!\n' + err);
	} else {
		console.log('You selected ' + value);
	}
});
```

# fields.Set(fields, opts)

Creates a new field Set. Sets batch prompt several fields including other sets.

* `{object|array}` `fields` An object or array of field instances to prompt for.

* `{object}` `opts` Select field options.

	* `{string}` `opts.fieldSeparator`

	  A string to render between each field being prompted. Default value is `'\n'`.

	* `{boolean}` `opts.stopOnError`

	  If `true` and a field's `validate()` fails, then the `Set` will stop
	  prompting, otherwise if `false`, it will continue to the next field. Default
	  value is `true`. You may want to set this `false` when using
	  `repromptOnError=false` (see `repromptOnError`).

Returns a `Set` field instance with the following properties:

* `{function}` `prompt(callback)`

	* `{function}` `callback(err, value)`

	  A function that is called when prompting has completed.

Events:

* `pre-prompt`

  Emitted before the current field is prompted.

  * `{object}` `field` The current field

* `post-prompt`

  Emitted after the current field has been prompted.

  * `{object}` `field` The current field
  * `{anything}` `err` The error if something failed
  * `{string}` `result` The result after the prompting

Object-based example:

```
fields.set({
	something: fields.text({
		promptLabel: 'Username',
		validate: function (value, callback) {
			callback(!value.length && new Error('Please enter a username'), value);
		}
	}),

	changePass: fields.select({
		promptLabel: 'Change password?',
		display: 'prompt',
		options: [ 'yes', 'no' ],
		next: function (value) {
			if (value == 'no') {
				return 'favfood';
			}
		}
	}),

	password: fields.text({
		promptLabel: 'Enter a password',
		password: true,
		validate: function (value, callback) {
			callback(!value.length, value);
		}
	}),

	favfood: fields.text({
		promptLabel: 'What is your favorite food?'
	})
}, { stopOnError: true }).prompt(function (err, value) {
	if (err) {
		console.error('There was an error!\n' + err);
	} else {
		console.log('You entered ' + value);
	}
});
```

Array-based example:

```
fields.set([
	fields.text({
		promptLabel: 'Username',
		validate: function (value, callback) {
			callback(!value.length, value);
		}
	}),

	fields.select({
		promptLabel: 'Change password?',
		display: 'prompt',
		options: [ 'yes', 'no' ],
		next: function (value) {
			if (value == 'no') {
				return 3;
			}
		}
	}),

	fields.text({
		promptLabel: 'Enter a password',
		password: true,
		validate: function (value, callback) {
			callback(!value.length, value);
		}
	}),

	fields.text({
		promptLabel: 'What is your favorite food?'
	})
]).prompt(function (err, value) {
	if (err) {
		console.error('There was an error!\n' + err);
	} else {
		console.log('You entered ' + value);
	}
});
```

# License

(The MIT License)

Copyright (c) 2013 Chris Barber

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

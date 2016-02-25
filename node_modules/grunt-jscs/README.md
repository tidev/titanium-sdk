# grunt-jscs
> Task for checking JavaScript Code Style with [jscs](https://github.com/jscs-dev/node-jscs).

[![Build Status](https://travis-ci.org/jscs-dev/grunt-jscs.svg?branch=master)](https://travis-ci.org/jscs-dev/grunt-jscs)
[![Dependency Status](https://david-dm.org/jscs-dev/grunt-jscs.svg)](https://david-dm.org/jscs-dev/grunt-jscs)
[![devDependency Status](https://david-dm.org/jscs-dev/grunt-jscs/dev-status.svg)](https://david-dm.org/jscs-dev/grunt-jscs#info=devDependencies)
[![NPM version](https://badge.fury.io/js/grunt-jscs.svg)](http://badge.fury.io/js/grunt-jscs)

## Getting started
This plugin requires Grunt `~0.4.2`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-jscs --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks("grunt-jscs");
```

## jscs task
_Run this task with the `grunt jscs` command._

Task targets, files and options may be specified according to the grunt [Configuring tasks](http://gruntjs.com/configuring-tasks) guide.

### Options
Any specified option will be passed through directly to JSCS, plus this plugin has additional options:

#### config
Type: `String`, `Boolean`
Default value: `true`

Defines how to externally load a JSCS configuration via the [JSCS config loader](http://jscs.info/overview.html#-config-).
The following is the behavior of this option:

- If set to a file path, then this file will be used;
- If set to `true`, JSCS will use its default config loading behavior;
- If set to `true` or to a file path with JSCS options specified in the grunt task, then they will be merged.

```js
jscs: {
    src: "path/to/files/*.js",
    options: {
        config: ".jscsrc",
        requireCurlyBraces: [ "if" ]
    }
}
```

#### force
Type: `Boolean`
Default value: `false`

Set `force` to `true` to report JSCS errors but not fail the task.

#### reporter
Type: `String`
Default value: `null`

Allows you to modify the output. By default it will use a built-in `grunt` reporter. Set the path to your own custom reporter or to one of the built-in JSCS [reporters](https://github.com/jscs-dev/node-jscs/tree/master/lib/reporters).

#### reporterOutput
Type: `String`
Default value: `null`

Specify a filepath to output the results of a reporter. If `reporterOutput` is specified then all output will be written to the given filepath instead of printed to stdout.

### Usage examples
```js
jscs: {
    main: [ "path/to/files/*.js" ],
    secondary: {
        options: {
            config: ".jscs-secondary",
        },
        files: {
            src: [ "path/to/more/files/**/*.js", "my-plugin.js" ]
        }
    },
    ternary: {
        options: {
            requireCurlyBraces: [ "if" ]
        },
        files: {
            src: "happy-hippo.js"
        }
    }
}
```

## Release History
See the [releases page](https://github.com/jscs-dev/grunt-jscs/releases).

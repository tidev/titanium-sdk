# findit

Recursively walk directory trees. Think `/usr/bin/find`.

[![build status](https://secure.travis-ci.org/andrewrk/node-findit.png)](http://travis-ci.org/andrewrk/node-findit)

## Why the fork?

There is a [pull request](https://github.com/substack/node-findit/pull/34) to
merge this project back into findit.

The pull request fixes every open issue in findit, and it completely rewrites
the code from the ground up.

It also adds an additional feature regarding symlinks.

I would love for substack to merge the pull request, but realistically it might
not happen, and this code is objectively cleaner, more robust, and fixes
several critical issues.

I recommend depending on this module rather than the original findit. If the
pull request is merged, however, I will add a deprecation notice to this module
and happily hand the maintainer hat back to substack.

# example

``` js
var finder = require('findit2')(process.argv[2] || '.');
var path = require('path');

finder.on('directory', function (dir, stat, stop, linkPath) {
    var base = path.basename(dir);
    if (base === '.git' || base === 'node_modules') stop()
    else console.log(dir + '/')
});

finder.on('file', function (file, stat, linkPath) {
    console.log(file);
});

finder.on('link', function (link, stat) {
    console.log(link);
});
```

# methods

``` js
var findit = require('findit2')
```

## var finder = findit(basedir, opts)

Return an event emitter `finder` that performs a recursive walk starting at
`basedir`.

If you set `opts.followSymlinks`, symlinks will be followed. Otherwise, a
`'link'` event will fire but symlinked directories will not be walked.

If `basedir` is actually a non-directory regular file, findit emits a single
"file" event for it then emits "end".

You can optionally specify a custom
[fs](http://nodejs.org/docs/latest/api/fs.html)
implementation with `opts.fs`. `opts.fs` should implement:

* `opts.fs.readdir(dir, cb)`
* `opts.fs.lstat(dir, cb)`
* `opts.fs.readlink(dir, cb)` - optional if your stat objects from
`opts.fs.lstat` never return true for `stat.isSymbolicLink()`

## finder.stop()

Stop the traversal. A `"stop"` event will fire and then no more events will
fire.

# events

## finder.on('path', function (file, stat, linkPath) {})

For each file, directory, and symlink `file`, this event fires.

If `followSymlinks` is `true`, then `linkPath` will be defined when `file`
was found via a symlink. In this situation, `linkPath` is the path including
the symlink; `file` is the resolved actual location on disk.

## finder.on('file', function (file, stat, linkPath) {})

For each file, this event fires.

## finder.on('directory', function (dir, stat, stop, linkPath) {})

For each directory, this event fires with the path `dir`.

Your callback may call `stop()` on the first tick to tell findit to stop walking
the current directory.

## finder.on('link', function (file, stat) {})

For each symlink, this event fires.

## finder.on('readlink', function (src, dst) {})

Every time a symlink is read when `opts.followSymlinks` is on, this event fires.

## finder.on('end', function () {})

When the recursive walk is complete unless `finder.stop()` was called, this
event fires.

## finder.on('stop', function () {})

When `finder.stop()` is called, this event fires.

## finder.on('error', function (err) {})

Whenever there is an error, this event fires. You can choose to ignore errors or
stop the traversal using `finder.stop()`.

You can always get the source of the error by checking `err.path`.

# install

With [npm](https://npmjs.org) do:

```
npm install findit2
```

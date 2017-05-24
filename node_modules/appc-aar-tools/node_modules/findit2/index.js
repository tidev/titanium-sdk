var EventEmitter = require('events').EventEmitter;
var fs = require('fs');
var path = require('path');

module.exports = findit;

function findit(basedir, opts) {
  opts = opts || {};
  var followSymlinks = !!opts.followSymlinks;
  var myFs = opts.fs || fs;
  var emitter = new EventEmitter();
  var stopped = false;
  var pending = 0;
  var seen = {};

  emitter.stop = stop;
  walkPath(basedir);
  return emitter;

  function recursiveReadDir(basedir, linkPath) {
    pendStart();
    myFs.readdir(basedir, function(err, entries) {
      if (stopped) return;
      if (err) {
        handleError(err, basedir);
        pendEnd();
        return;
      }
      entries.forEach(function(entry) {
        var fullPath = path.join(basedir, entry);
        var fullLinkPath = linkPath && path.join(linkPath, entry);
        walkPath(fullPath, fullLinkPath);
      });
      pendEnd();
    });
  }

  function walkPath(fullPath, linkPath) {
    pendStart();
    myFs.lstat(fullPath, function(err, stats) {
      if (stopped) return;
      if (err) {
        handleError(err, fullPath);
        pendEnd();
        return;
      }
      emitter.emit('path', fullPath, stats, linkPath);
      var dirStopped = false;
      if (stats.isDirectory()) {
        if (seen[fullPath]) {
          err = new Error("file system loop detected");
          err.code = 'ELOOP';
          handleError(err, fullPath);
          pendEnd();
          return;
        }
        seen[fullPath] = true;

        emitter.emit('directory', fullPath, stats, stopDir, linkPath);
        if (!dirStopped) recursiveReadDir(fullPath, linkPath);
      } else if (stats.isFile()) {
        if (!seen[fullPath]) {
          seen[fullPath] = true;
          emitter.emit('file', fullPath, stats, linkPath);
        }
      } else if (stats.isSymbolicLink()) {
        emitter.emit('link', fullPath, stats, linkPath);
        if (followSymlinks) recursiveReadLink(fullPath);
      }
      pendEnd();

      function stopDir() {
        dirStopped = true;
      }
    });
  }

  function recursiveReadLink(linkPath) {
    pendStart();
    myFs.readlink(linkPath, function(err, linkString) {
      if (stopped) return;
      if (err) {
        handleError(err, linkPath);
        pendEnd();
        return;
      }
      var fullPath = path.resolve(path.dirname(linkPath), linkString);
      emitter.emit('readlink', linkPath, fullPath);
      walkPath(fullPath, linkPath);
      pendEnd();
    });
  }

  function stop() {
    if (stopped) return;
    stopped = true;
    emitter.emit('stop');
  }

  function handleError(err, errPath) {
    if (!err || stopped) return;
    err.path = errPath;
    emitter.emit('error', err);
  }

  function pendStart() {
    pending += 1;
  }

  function pendEnd() {
    if (stopped) return;
    pending -= 1;
    if (pending === 0) {
      emitter.emit('end');
    } else if (pending < 0) {
      // this should never happen; if this gets thrown we need to debug findit
      // and this stack trace will help.
      throw new Error("pendEnd called too many times");
    }
  }
}

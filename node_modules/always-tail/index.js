var Tail, environment, events, fs,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

var debug = require('debug')('always-tail');
var events = require("events");
var fs = require('fs');

environment = process.env['NODE_ENV'] || 'development';

Tail = (function(_super) {
  __extends(Tail, _super);

  /**
   * read a block of data and try to emit a line
   *
   * @private
   */
  Tail.prototype.readBlock = function() {
    var block, stream,
      self = this;

    var next = function() {

      if (block.type == 'close') {
        fs.close(block.fd);
        delete self.bookmarks[block.fd];
      };

      if (self.queue.length >= 1) { self.internalDispatcher.emit("next"); }
    };

    if (this.queue.length >= 1) {

      block = this.queue.shift();

      fs.fstat(block.fd, function(err, stat) {

        if (err) { return next(); };

        var start = self.bookmarks[block.fd];
        var end = stat.size;
  
        if (end < start) {
          // file was truncated
          debug('file was truncated:', self.filename);
          self.bookmarks[block.fd] = start = 0;
        };

        var size = end - start;
        if (size == 0) return next(); // no data.
        if (size > self.blockSize) {
          debug('block is too large, recreasing to ', self.blockSize);
          size = self.blockSize;
          self.queue.push(block); // for future data processing
        }

        var buffer = new Buffer(size);

        debug("reading:", block.fd, size, start);
        fs.read(block.fd, buffer, 0, size, start, function(err, bytesRead, buff) {
          var chunk, parts, _i, _len, _results;

          if (err) { return self.emit('error', err); };

          if (bytesRead == 0) { return next() };

          self.bookmarks[block.fd] += bytesRead;
          buff = buff.toString("utf-8");
          self.buffer += buff;
          parts = self.buffer.split(self.separator);
          self.buffer = parts.pop();

          _results = [];
          for (_i = 0, _len = parts.length; _i < _len; _i++) {
            chunk = parts[_i];
            _results.push(self.emit("line", chunk));
          }
          next();
        });
      });
    }
  };

  /**
   * Tail a file continuously.  If a file gets rolled over, will continue
   * to read the file to its end even if it is renamed, then automatically starts
   * reading data from the new file.
   *
   * It does this by monitoring the filename, and when the inode changes, 
   * it will continue to read to the end of the existing file descriptor.
   *
   * It emits a 'line' event when a new line is read. 
   *
   * Credits: Much of this code was built on the node-tail module.
   *
   * @param {String} filename filename to monitor
   * @param {String} separator default separator is '\n' 
   * @param {Object} options options object
   * @param {Integer} options.start (optional) start offset to read data from file, default: 0
   * @param {Integer} options.interval (optional) interval to monitor for changes, default: 5000ms 
   *
   */
  function Tail(filename, separator, options) {
    var self = this;
    options = options || {};

    this.filename = filename;
    this.separator = separator != null ? separator : '\n';
    this.options = options != null ? options : {};
    this.readBlock = __bind(self.readBlock, this);
    this.buffer = '';
    this.internalDispatcher = new events.EventEmitter();
    this.queue = [];
    this.isWatching = false;
    this.internalDispatcher.on('next', function() {
      return self.readBlock();
    });

    this.interval = options.interval || 5000;
    this.blockSize = options.blockSize || 1024 * 1024; // 1 MB by default
   
    this.fd = null;
    this.inode = 0;
    this.bookmarks = {};

    if (fs.existsSync(this.filename)) { 
      this.fd = fs.openSync(this.filename, 'r');
      var stat = fs.statSync(this.filename);
      this.inode = stat.ino;
      if (this.options.hasOwnProperty('start')) {
        this.bookmarks[this.fd] = this.options.start
      } else {
        this.bookmarks[this.fd] = stat.size;
      }
    }

    setTimeout(function() {
      self.watch();
      if (self.fd) {
        self.queue.push({
          type: 'read',
          fd: self.fd,
        });
        self.internalDispatcher.emit("next");
      }
    });
  }

  /**
   * Stop watching a file.
   *
   * @public
   */
  Tail.prototype.unwatch = function() {
    var self = this;

    if (self.watcher) {
      fs.unwatchFile(self.filename);
    };
    
    if (self.fd) {
      fs.close(self.fd); 
      self.fd = null;
    };

    // close any legacy fds 
    for (var i in self.queue) {
      var item = self.queue[i];
      if (item.type == 'close') {
        fs.close(item.fd); 
      };
    };

    self.queue = [];
  };


  /**
   * Close current file descriptor.
   *
   * @param {Function} callback (optional) callback when fd is closed
   *
   * @private
   */
  Tail.prototype.closeCurrent = function(callback) {
    var self = this;
    callback = callback || function() {};

    if (self.fd == null) return callback(); 

    self.queue.push({
      type: 'close',
      fd: self.fd
    });

    self.fd = null;

    callback();
  };

  /**
   * Start watching a file.
   *
   * @public
   */
  Tail.prototype.watch = function() {
    var self = this;

    if (self.watcher) return;
    
    self.checking = false;
   
    self.watcher = fs.watchFile(this.filename, { interval: self.interval }, function(curr, prev) {

      if (self.checking) return;

      self.checking = true;

       var checkOpen = function(callback) {
         if (self.fd == null) {
           fs.exists(self.filename, function(exists) {
             if (exists) {
               self.fd = fs.openSync(self.filename, 'r');
               self.inode = curr.ino;
               self.bookmarks[self.fd] = 0;
             }
             callback();
           });
         } else { 
          callback();
         }
       };

       // add a read event;
       var readPending = function(callback) {
         if (self.fd != null) {
           self.queue.push({
             type: 'read',
             fd: self.fd,
           });
           callback();
         } else {
           callback();
         }
       };

      if (curr.ino != self.inode) {
        self.closeCurrent(function() {
          checkOpen(function() {
            readPending(function() {
              self.checking = false;
              if (self.queue.length > 0) {
                return self.internalDispatcher.emit("next");
              }
            });    
          });
        }); 
      } else {
        checkOpen(function() {
          readPending(function() {
            self.checking = false;
            if (self.queue.length > 0) {
              return self.internalDispatcher.emit("next");
            }
          });
        }) 
      }
    });
  };

  return Tail;

})(events.EventEmitter);

module.exports = Tail;

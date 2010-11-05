(function() {
    /* A node.js command line processing module ported to titaniumm desktop */
    var argv = Titanium.App.getArguments();
    var env = Titanium.API.getEnvironment();
    var exec = Titanium.App.getPath();
    var execDir = Titanium.Filesystem.getFile(exec).parent;

    Titanium.Optimist = Argv(argv);

    function Argv (args, cwd) {
        var self = {};
        if (!cwd) cwd = env['PWD'];
    
        self.$0 = argv.join(' ');
    
        if (argv[1] == env._) {
            self.$0 = env._.replace(
                execDir + '/', ''
            );
        }
    
        self.argv = { _ : [], $0 : self.$0 };
    
        function set (key, value) {
            if (key in self.argv) {
                if (!Array.isArray(self.argv[key])) {
                    self.argv[key] = [ self.argv[key] ];
                }
                self.argv[key].push(value);
            }
            else {
                self.argv[key] = value;
            }
        }
    
        for (var i = 0; i < args.length; i++) {
            var arg = args[i];
        
            if (arg == '--') {
                self.argv._.push.apply(self.argv._, args.slice(i + 1));
                break;
            }
            else if (arg.match(/^--.+=/)) {
                var m = arg.match(/^--([^=]+)=(.*)/);
                var name = m[1];
                var value = m[2];
                if (name.indexOf('-') > -1) {
                    var words = name.split('-');
                    words.slice(1).forEach(function(word, index) {
                        words[index+1] = word.charAt(0).toUpperCase() + word.substring(1);
                    });
                    name = words.join('');
                }
                set(name, value);
            }
            else if (arg.match(/^--no-.+/)) {
                var key = arg.match(/^--no-(.+)/)[1];
                set(key, false);
            }
            else if (arg.match(/^--.+/)) {
                var key = arg.match(/^--(.+)/)[1];
                set(key, true);
            }
            else if (arg.match(/^-[^-]+/)) {
                arg.slice(1,-1).split('').forEach(function (letter) {
                    set(letter, true);
                });
            
                var key = arg.slice(-1)[0];
            
                if (args[i+1] && !args[i+1].match(/^-/)) {
                    set(key, args[i+1]);
                    i++;
                }
                else {
                    set(key, true);
                }
            }
            else {
                self.argv._.push(arg);
            }
        }
    
        var usage;
        self.usage = function (msg) {
            usage = msg;
            return self;
        };
    
        function fail (msg) {
            if (usage) Ti.API.error(usage.replace(/\$0/g, self.$0))
            Ti.API.error(msg);
            Titanium.App.exit();
        }
    
        self.check = function (f) {
            try {
                if (f(self.argv) === false) fail(err);
            }
            catch (err) { fail(err) }
        
            return self;
        };
    
        self.demand = function (keys, cb) {
            var missing = [];
            keys.forEach(function (key) {
                if (!(key in self.argv)) missing.push(key);
            });
        
            if (missing.length) {
                if (cb) cb(missing);
                else fail('Missing arguments: ' + missing.join(' '));
            }
            return self;
        };
    
        self.parse = function (args) {
            return Argv(args).argv;
        };
    
        return self;
    };

    // rebase an absolute path to a relative one with respect to a base directory
    // exported for tests
    /*module.exports.rebase = rebase;
    function rebase (base, dir) {
        var ds = path.normalize(dir).split('/').slice(1);
        var bs = path.normalize(base).split('/').slice(1);
    
        for (var i = 0; ds[i] && ds[i] == bs[i]; i++);
        ds.splice(0, i); bs.splice(0, i);
    
        var p = path.normalize(
            bs.map(function () { return '..' }).concat(ds).join('/')
        ).replace(/\/$/,'').replace(/^$/, '.');
        return p.match(/^[.\/]/) ? p : './' + p;
    }*/
})();
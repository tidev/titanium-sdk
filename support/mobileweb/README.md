# Everything in this folder is obsolete and can be deleted

### closureCompiler

Used by old Mobile Web Python build script. Replaced by UglifyJS in new CLI.

### imageResizer

Used by old Mobile Web Python build script. Moved to node-appc.

### minify

Used by old Mobile Web Python build script. This was a simple runner that
instantiated the Closure Compiler once, then recursively processed an entire
folder of JavaScript files.

### resources

These have been moved to `mobileweb/templates/app/default/Resources/mobileweb`.

### builder.py

The old build script entry point.

### compiler.py

The actual Mobile Web build script invoked by the builder.py.

### tiapp.py

An old utility class for reading the tiapp.xml.

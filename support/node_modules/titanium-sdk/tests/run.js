var spawn = require('child_process').spawn,
	exitCode = 0,
	tests = [
		'test-tiappxml.js'
	];

(function next() {
	if (tests.length === 0) {
		process.exit(exitCode);
	}
	
	var file = tests.shift();
	console.log(file);
	
	var proc = spawn('node', [ 'tests/' + file ]);
	proc.stdout.pipe(process.stdout);
	proc.stderr.pipe(process.stderr);
	proc.on('exit', function (code) {
		exitCode += code || 0;
		console.log('');
		next();
	});
}());

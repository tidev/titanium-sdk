var child_process = require('child_process');


module.exports = new function() {
	this.runCommand = function(command, logLevel, callback) {
		child_process.exec(command, function(error, stdout, stderr) {
			if(logLevel > 1) {
				process.stdout.write(stdout);
			}
			if(logLevel > 0) {
				process.stderr.write(stderr);
			}

			if(callback != null) {
				callback(error);
			}
		});
	}

	this.runProcess = function(filename, args, stdoutCallback, stderrCallback, exitCallback) {
		var newProcess = child_process.spawn(filename, args);

		if(stdoutCallback != null) {
			newProcess.stdout.on('data', function(data) {
				var stdoutString = data.toString();

				if(stdoutCallback == 0) {
					process.stdout.write(stdoutString);

				} else {
					stdoutCallback(stdoutString);
				}
			});
		}

		if(stderrCallback != null) {
			newProcess.stderr.on('data', function(data) {
				var stderrString = data.toString();

				if(stderrCallback == 0) {
					process.stderr.write(stderrString);

				} else {
					stderrCallback(stderrString);
				}
			});
		}

		if(exitCallback != null) {
			newProcess.on('exit', function(code) {
				if(exitCallback == 0) {
					process.stderr.write(code);

				} else {
					exitCallback(code);
				}
			});
		}

		return newProcess;
	}

	this.getArgument = function(name) {
		var value;

		for(var i in process.argv) {
			if(process.argv[i].indexOf(name) == 0) {
				var elements = process.argv[i].split("=");
				if(elements.length == 2) {
					value = elements[1];
					break;
				}
			}
		}

		return value;
	}
}

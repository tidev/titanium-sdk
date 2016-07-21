var exec = require('child_process').exec;

var Git = {};
/**
 * Get the short (7-character) SHA hash of HEAD in the supplied workig directory.
 * @param  {Function} next [description]
 */
Git.getHash = function (cwd, next) {
	exec('git rev-parse --short --no-color HEAD', {cwd: cwd}, function (error, stdout, stderr) {
		if (error) {
			return next('Failed to get Git HASH: ' + error);
		}

		next(null, stdout.trim()); // drop leading 'commit ', just take 7-character sha
	});
}

module.exports = Git;

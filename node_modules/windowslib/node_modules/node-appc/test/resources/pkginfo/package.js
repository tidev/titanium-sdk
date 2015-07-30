module.exports = function () {
	var args = Array.prototype.slice.call(arguments);
	args.unshift(module);
	return require('../../../index').pkginfo.package.apply(null, args);
};
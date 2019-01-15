'use strict';

/**
 * This function 'standardizes' the reported architectures to the equivalents reported by Node.js
 * node values: 'arm', 'arm64', 'ia32', 'mips', 'mipsel', 'ppc', 'ppc64', 's390', 's390x', 'x32', and 'x64'.
 * iOS values: "arm64", "armv7", "x86_64", "i386", "Unknown"
 * Android values: "armeabi", "armeabi-v7a", "arm64-v8a", "x86", "x86_64", "mips", "mips64", "unknown"
 * Windows values: "x64", "ia64", "ARM", "x86", "unknown"
 * @param {string} original original architecture reported by Ti.Platform
 * @returns {string}
 */
function standardizeArch(original) {
	switch (original) {
		// coerce 'armv7', 'armeabi', 'armeabi-v7a', 'ARM' -> 'arm'
		// 'armeabi' is a dead ABI for Android, removed in NDK r17
		case 'armv7':
		case 'armeabi':
		case 'armeabi-v7a':
		case 'ARM':
			return 'arm';

		// coerce 'arm64-v8a' -> 'arm64'
		case 'arm64-v8a':
			return 'arm64';

		// coerce 'i386', 'x86' -> 'ia32'
		case 'i386':
		case 'x86':
			return 'ia32';

		// coerce 'x86_64', 'ia64', 'x64' -> 'x64'
		case 'x86_64':
		case 'ia64':
			return 'x64';

		// coerce 'mips64' -> 'mips' // 'mips' and 'mips64' are dead ABIs for Android, removed in NDK r17
		case 'mips64':
			return 'mips';

		// coerce 'Unknown' -> 'unknown'
		case 'Unknown':
			return 'unknown';

		default:
			return original;
	}
}

const process = {
	arch: standardizeArch(Ti.Platform.architecture),
	cwd: function () {
		return __dirname;
	},
	// FIXME: Should we try and adopt 'windowsphone'/'windowsstore' to 'win32'?
	// FIXME: Should we try and adopt 'ipad'/'iphone' to 'darwin'? or 'ios'?
	platform: Ti.Platform.osname
};
global.process = process;
module.exports = process;

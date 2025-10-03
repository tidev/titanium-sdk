import { promisify } from 'util';
import child_process from 'child_process';

const exec = promisify(child_process.exec);

/**
 * Get the short (10-character) SHA hash of HEAD in the supplied working directory.
 * @param {string} cwd current working directory path
 * @returns {Promise<string>} sha of current git commit for HEAD
 */
export async function getHash(cwd) {
	const { stdout } = await exec('git rev-parse --short=10 --no-color HEAD', { cwd });
	return stdout.trim(); // drop leading 'commit ', just take 10-character sha
}

/**
 * Discards a local Git change.
 * @param {string} cwd current working directory path
 * @param {string} file the file to discard
 * @returns {Promise<string>} sha of current git commit for HEAD
 */
export function discardLocalChange(cwd, file) {
	return exec(`git checkout -- ${file}`, { cwd });
}

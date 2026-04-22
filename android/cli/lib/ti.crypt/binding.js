import crypto from 'crypto';

export function getKey(salt) {
	return crypto
		.createHash('sha256')
		.update(salt)
		.digest()
		.subarray(0, 16);
}

import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import path from 'node:path';

export class Crypt {
	constructor() {
		// 16-byte salt (also IV)
		this.salt = crypto.randomBytes(16);
	}

	#getKey() {
		// SHA-256 → 16 bytes
		return crypto.createHash('sha256').update(this.salt).digest().subarray(0, 16);
	}

	async encryptFile(input, output) {
		const data = await fs.readFile(input);

		const cipher = crypto.createCipheriv(
			'aes-128-cbc',
			this.#getKey(),
			this.salt
		);

		const encrypted = Buffer.concat([
			cipher.update(data),
			cipher.final()
		]);

		await fs.writeFile(output, encrypted);
	}

	async setKey(platform, abis, outDir) {
		if (platform !== 'android') {
			return;
		}

		// Write salt into each ABI folder
		await Promise.all(
			abis.map(async abi => {
				const dir = path.join(outDir, abi);
				await fs.mkdir(dir, { recursive: true });

				await fs.writeFile(
					path.join(dir, 'crypt.key'),
					this.salt
				);
			})
		);
	}
}

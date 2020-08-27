export class FastBuffer extends Uint8Array {}

/**
 * loop over input, every 2 characters, parse as an int
 * basically each two characters are a "byte" or an 8-bit uint
 * we append them all together to form a single buffer holding all the values
 * @param {string} value string we're encoding in hex
 * @returns {integer[]} array of encoded bytes
 */
export function stringToHexBytes(value) {
	const length = value.length / 2;
	const byteArray = [];
	for (let i = 0; i < length; i++) {
		const numericValue = parseInt(value.substr(i * 2, 2), 16);
		if (!Number.isNaN(numericValue)) { // drop bad hex characters
			byteArray.push(numericValue);
		}
	}
	return byteArray;
}

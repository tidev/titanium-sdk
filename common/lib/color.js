/**
 * This script is used at runtime for Ti.UI.fetchSemanticColor - as well as at build time by both iOS/Android.
 * It provides a common interface for handling colors and converting to necessary string forms.
 */
'use strict';

const HEX_3_REGEX = /^#?([a-f\d])([a-f\d])([a-f\d])$/i; // i.e. #0F3
const HEX_4_REGEX = /^#?([a-f\d])([a-f\d])([a-f\d])([a-f\d])$/i; // i.e. #0F38
const HEX_6_REGEX = /^#?([a-f\d]){6}$/i; // i.e. #00FF33
const HEX_8_REGEX = /^#?([a-f\d]){8}$/i; // i.e. #00FF3388

/**
 * @param {number} integer in range of 0-255
 * @returns {string} 2-character hex string value
 */
function paddedHex(integer) {
	const str = integer.toString(16);
	if (str.length === 1) {
		return `0${str}`;
	}
	return str;
}

class Color {
	/**
	 * @param {number} r red value in range 0-255
	 * @param {number} g green value in range 0-255
	 * @param {number} b blue value in range 0-255
	 * @param {number} [a=1.0] alpha value in range 0.0-1.0
	 */
	constructor(r, g, b, a = 1.0) {
		this.r = r;
		this.g = g;
		this.b = b;
		this.alpha = a;
	}

	/**
	 * indicates if this is a fully opaque color (alpha is 1.0 or was undefined)
	 * @returns {boolean}
	 */
	isOpaque() {
		return this.alpha === 1.0;
	}

	/**
	 * Converts the alpha value into equivalent hex string value properly.
	 * @returns {string}
	 */
	alphaHex() {
		// need to round to avoid nonsensical values like '7f.8' for a 0.5 alpha
		return paddedHex(Math.round(this.alpha * 255.0));
	}

	/**
	 * Discards any alpha value. To be used internally, not external api. Does not provide leading '#' symbol.
	 * @returns {string}
	 */
	_toRGBHexString() {
		return `${paddedHex(this.r)}${paddedHex(this.g)}${paddedHex(this.b)}`;
	}

	/**
	 * Used by IOS.
	 * Converts this color to a hex string with leading '#' symbol and 6- or 8-
	 * hexadecimal characters (depending on if alpha is 1.0)
	 * @returns {string}
	 */
	toRGBAHexString() {
		if (this.isOpaque()) {
			return `#${this._toRGBHexString()}`;
		}
		return `#${this._toRGBHexString()}${this.alphaHex()}`;
	}

	/**
	 * Used by Android
	 * Converts this color to a hex string with leading '#' symbol and 6- or 8-
	 * hexadecimal characters (depending on if alpha is 1.0). Alpha is the first entry (if there is alpha.)
	 * @returns {string}
	 */
	toARGBHexString() {
		if (this.isOpaque()) {
			return `#${this._toRGBHexString()}`;
		}
		return `#${this.alphaHex()}${this._toRGBHexString()}`;
	}

	/**
	 * Converts this color to an rgba expression. This expression is more consistent across platforms.
	 * (whereas iOS/Android differ in expecttaiosn for hex strings.)
	 * @returns {string}
	 */
	toRGBAString() {
		return `rgba(${this.r}, ${this.g}, ${this.b}, ${this.alpha.toFixed(3)})`;
	}

	/**
	 * @returns {Color}
	 */
	static fallback() {
		return new Color(0, 0, 0); // return black to match native impl in iOS
	}

	/**
	 * The supplied hex string MUST be in form '#000000' (i.e. leading pound symbol, 6 hex characters after)
	 * @param {string} hex hexadecimal color string
	 * @param {number} [alpha] alpha value
	 * @returns {Color}
	 */
	static fromHex6String(hex, alpha) {
		const startIndex = hex.startsWith('#') ? 1 : 0;
		const r = parseInt(hex.substr(startIndex, 2), 16);
		const g = parseInt(hex.substr(startIndex + 2, 2), 16);
		const b = parseInt(hex.substr(startIndex + 4, 2), 16);
		return new Color(r, g, b, alpha);
	}

	/**
	 * The supplied hex string MUST be in form '#00000000' (i.e. leading pound symbol, 8 hex characters after)
	 * @param {string} hex hexadecimal color string
	 * @returns {Color}
	 */
	static fromHex8String(hex) {
		const startIndex = hex.startsWith('#') ? 1 : 0;
		const r = parseInt(hex.substr(startIndex, 2), 16);
		const g = parseInt(hex.substr(startIndex + 2, 2), 16);
		const b = parseInt(hex.substr(startIndex + 4, 2), 16);
		const alpha = parseInt(hex.substr(startIndex + 6, 2), 16); // alpha is now 0-255
		return new Color(r, g, b, alpha / 255.0); // convert to 0.0-1.0 (percent)
	}

	/**
	 * Note that the hex value can contain alpha, but must follow the CSS standard of #RRGGBBAA (NOT the Android standard of #AARRGGBB)
	 * @param {string|object} entry possible hex string or an object
	 * @param {string|number} [hex.alpha] alpha value in percent (0.0-100.0) when hex is an object
 	 * @param {string} [hex.color] hex string for the base color when hex is an object
	 * @returns {Color}
	 * @throws if entry has both an explicit alpha value AND a hex string containing an alpha value
	 */
	static fromSemanticColorsEntry(entry) {
		let color = entry;
		let alpha = 1.0;
		let hadAlpha = false;
		if (Object.prototype.hasOwnProperty.call(entry, 'alpha')) {
			alpha = parseFloat(entry.alpha) / 100.0; // convert from 0-100 range to 0-1 range
			hadAlpha = true;
			color = entry.color; // if it has an alpha property assume it has a color property too!
		}

		// expand the shorter hex string forms to 6 or 8 digits
		if (color.length === 3) {
			// Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
			color = color.replace(HEX_3_REGEX, (m, r, g, b) => r + r + g + g + b + b);
		} else if (color.length === 4) {
			// Expand shorthand form (e.g. "03F8") to full form (e.g. "0033FF88")
			color = color.replace(HEX_4_REGEX, (m, r, g, b, a) => r + r + g + g + b + b + a + a);
		}

		if (HEX_6_REGEX.exec(color)) {
			return Color.fromHex6String(color, alpha);
		}
		if (HEX_8_REGEX.exec(color)) {
			if (hadAlpha) {
				throw new Error(`Color ${entry} had an explicit alpha value AND a hex value containing alpha. Use one or the other.`);
			}
			return Color.fromHex8String(color);
		}
		// uh-oh, something is up!
		return Color.fallback();
	}
}

module.exports = Color;

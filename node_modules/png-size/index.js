
/**
 * Expose `size`.
 */

module.exports = size;

/**
 * Uint32BE.
 */

function u32(buf, o) {
  return buf[o] << 24
    | buf[o + 1] << 16
    | buf[o + 2] << 8
    | buf[o + 3];
}

/**
 * Return dimensions from png `buf`.
 *
 * @param {Buffer} buf
 * @return {Object}
 * @api public
 */

function size(buf) {
  return {
    width: u32(buf, 16),
    height: u32(buf, 16 + 4)
  }
}

'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.isAsync = exports.supportsAsync = undefined;

var _identity = require('lodash/identity');

var _identity2 = _interopRequireDefault(_identity);

var _asyncify = require('../asyncify');

var _asyncify2 = _interopRequireDefault(_asyncify);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var supportsSymbol = typeof Symbol === 'function';

function supportsAsync() {
    var supported;
    try {
        /* eslint no-eval: 0 */
        supported = isAsync(eval('(async function () {})'));
    } catch (e) {
        supported = false;
    }
    return supported;
}

function isAsync(fn) {
    return supportsSymbol && fn[Symbol.toStringTag] === 'AsyncFunction';
}

function wrapAsync(asyncFn) {
    return isAsync(asyncFn) ? (0, _asyncify2.default)(asyncFn) : asyncFn;
}

exports.default = supportsAsync() ? wrapAsync : _identity2.default;
exports.supportsAsync = supportsAsync;
exports.isAsync = isAsync;
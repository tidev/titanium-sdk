// Actual path from root directory("Resources") to absolute/b.js -> Resources/suites/commonjs/absolute/
exports.foo = function () {
    return require('/suites/commonjs/absolute/b');//Path modified to correct absolute path
};

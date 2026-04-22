import Crypt from './crypt.js';

export default Crypt;
export { Crypt };

if (typeof module !== 'undefined') {
    module.exports = Crypt;
    module.exports.default = Crypt;
}

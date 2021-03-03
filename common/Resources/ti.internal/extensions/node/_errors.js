/**
 * @param  {*} arg passed in argument value
 * @param  {string} name name of the argument
 * @param  {string} typename i.e. 'string', 'Function' (value is compared to typeof after lowercasing)
 * @return {void}
 * @throws {TypeError}
 */
export function assertArgumentType(arg, name, typename) {
	const type = typeof arg;
	if (type !== typename.toLowerCase()) {
		throw new TypeError(`The "${name}" argument must be of type ${typename}. Received type ${type}`);
	}
}

export default assertArgumentType;

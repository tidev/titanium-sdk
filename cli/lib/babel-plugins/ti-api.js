/**
 * Keeps track of the Titanium APIs used globally (across the whoel build, so implicitly "per-project").
 */
const apiUsage = {};

/**
 * Keeps track of the Titanium APIs used for a given files.
 */
const symbols = new Set();

/**
 * The actual Babel plugin definition. This plugin does not transform anything in the AST/code,
 * but instead tracks usage of our Titanium APIs for our own analytics as well as to help
 * pare production builds down to only include the Titanium APIs/modules/frameworks used by the app.
 * @param {object} _ref object containing references for babel plugins to make use of
 * @param {object} _ref.types instance of @babel/types
 * @returns {object} the instance of the plugin used by Babel during transforms
 */
export function plugin(_ref) {
	const types = _ref.types;
	/**
	 * Returns the name of identifiers, value of string literals, or `'obj.value'` of member expressions.
	 * @param {object} node an AST node from Babel
	 * @returns {string|null} value of a given node.
	 */
	function getMemberValue(node) {
		if (types.isIdentifier(node)) {
			return node.name;
		}

		if (types.isStringLiteral(node)) {
			return node.value;
		}

		if (!types.isMemberExpression(node)) {
			return null;
		}

		if (node.computed && !types.isStringLiteral(node.property)) {
			return null;
		}

		const objVal = getMemberValue(node.object);
		if (objVal === null) {
			return null;
		}

		const propVal = getMemberValue(node.property);
		if (propVal === null) {
			return null;
		}
		return objVal + '.' + propVal;
	}

	/**
	 * Given a MemberExpression node, returns the expression as a String if possible
	 * (if composed of literals/identifiers)
	 * @param {object} member an AST node (MemberExpression) from Babel
	 * @returns {string|null}
	 */
	function getTitaniumExpression(member) {
		if (types.isStringLiteral(member.object)) {
			// Prevent picking up strings in evaluation.
			// e.g: "Ti.Test".toUpperCase();
			return null;
		}

		const value = getMemberValue(member);
		if (value === null) {
			return null;
		}

		// Ensure this is a namespace and not a string starting with Ti. or Titanium.
		const tiNodeRegExp = /^Ti(tanium)?[.\w+]+$/;
		if (tiNodeRegExp.test(value)) {
			// Normalize 'Ti.*' to 'Titanium.*'
			if (value.startsWith('Ti.')) {
				return `Titanium.${value.substring(3)}`;
			}
			return value;
		}
		return null;
	}

	return {
		pre() {
			symbols.clear(); // wipe symbols before each AST, gather these "per-file"
		},
		visitor: {
			MemberExpression(path, state) {
				const memberExpr = getTitaniumExpression(path.node);
				if (memberExpr) {
					symbols.add(memberExpr.substring(9)); // Drop leading 'Titanium.'
					if (!state.opts.skipStats) {
						if (apiUsage[memberExpr] === undefined) {
							apiUsage[memberExpr] = 1;
						} else {
							apiUsage[memberExpr]++;
						}
					}
				}
			}
		}
	};
}

plugin.apiUsage = apiUsage; // expose the apiUsage
plugin.symbols = symbols; // expose the symbol usage

export default plugin;

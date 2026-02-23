const THIS_BREAK_KEYS = [ 'FunctionExpression', 'FunctionDeclaration', 'ClassProperty',
	'ClassMethod', 'ObjectMethod' ];

// Walk the AST looking for 'this' references intended to be references to global
// Replace them with an explicit 'global' reference
export function plugin(_ref) {
	const t = _ref.types;
	return {
		visitor: {
			ThisExpression(path, state) {
				if (
					state.opts.allowTopLevelThis !== true
					&& !path.findParent((path) => !path.is('shadow')
					&& THIS_BREAK_KEYS.indexOf(path.type) >= 0)
				) {
					// TODO: Spit out a warning/deprecation notice?
					path.replaceWith(t.identifier('global'));
				}
			}
		}
	};
}

export default plugin;

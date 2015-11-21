/**
 * UglifyJS AST helper functions.
 *
 * @module ast
 *
 * @copyright
 * Copyright (c) 2009-2014 by Appcelerator, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

/**
 * Returns an array of base AST objects for a given AST node.
 * @param {Object} node
 * @returns {Array} Array of base AST objects
 */
module.exports.getType = function (node, UglifyJS) {
	var ujs = UglifyJS || require('uglify-js'),
		types = [
			'AST_Node',
			'AST_Token',
			'AST_Statement',
			'AST_Debugger',
			'AST_Directive',
			'AST_SimpleStatement',
			'AST_Block',
			'AST_BlockStatement',
			'AST_EmptyStatement',
			'AST_StatementWithBody',
			'AST_LabeledStatement',
			'AST_DWLoop',
			'AST_Do',
			'AST_While',
			'AST_For',
			'AST_ForIn',
			'AST_With',
			'AST_Scope',
			'AST_Toplevel',
			'AST_SymbolDeclaration',
			'AST_String',
			'AST_Assign',
			'AST_Sub',
			'AST_SymbolRef',
			'AST_Lambda',
			'AST_Accessor',
			'AST_Function',
			'AST_Defun',
			'AST_Jump',
			'AST_Exit',
			'AST_Return',
			'AST_Throw',
			'AST_LoopControl',
			'AST_Break',
			'AST_Continue',
			'AST_If',
			'AST_Switch',
			'AST_SwitchBranch',
			'AST_Default',
			'AST_Case',
			'AST_Try',
			'AST_Catch',
			'AST_Finally',
			'AST_Definitions',
			'AST_Var',
			'AST_Const',
			'AST_VarDef',
			'AST_Call',
			'AST_New',
			'AST_Seq',
			'AST_PropAccess',
			'AST_Dot',
			'AST_Sub',
			'AST_Unary',
			'AST_UnaryPrefix',
			'AST_UnaryPostfix',
			'AST_Binary',
			'AST_Conditional',
			'AST_Assign',
			'AST_Array',
			'AST_Object',
			'AST_ObjectProperty',
			'AST_ObjectKeyVal',
			'AST_ObjectSetter',
			'AST_ObjectGetter',
			'AST_Symbol',
			'AST_SymbolAccessor',
			'AST_SymbolDeclaration',
			'AST_SymbolVar',
			'AST_SymbolConst',
			'AST_SymbolFunarg',
			'AST_SymbolDefun',
			'AST_SymbolLambda',
			'AST_SymbolCatch',
			'AST_Label',
			'AST_SymbolRef',
			'AST_LabelRef',
			'AST_This',
			'AST_Constant',
			'AST_Number',
			'AST_RegExp',
			'AST_Atom',
			'AST_Null',
			'AST_NaN',
			'AST_Undefined',
			'AST_Hole',
			'AST_Infinity',
			'AST_Boolean',
			'AST_False',
			'AST_True'
		],
		matches = [];

	types.forEach(function (t) {
		if (node instanceof ujs[t]) {
			matches.push(t);
		}
	});

	return matches;
};
/**
 * node-appc - Appcelerator Common Library for Node.js
 * Copyright (c) 2009-2014 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

var appc = require('../index'),
	fs = require('fs'),
	UglifyJS = require('uglify-js');

describe('ast', function () {
	it('namespace exists', function () {
		appc.should.have.property('ast');
		appc.ast.should.be.an.Object;
	});

	describe('#getType()', function () {
		it('should discover the ast node types', function () {
			var ast = UglifyJS.parse(fs.readFileSync(__filename).toString(), { filename: __filename });
			appc.ast.getType(ast).should.eql([
				'AST_Node',
				'AST_Statement',
				'AST_Block',
				'AST_Scope',
				'AST_Toplevel'
			]);
		});
	});
});
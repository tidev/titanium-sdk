/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env node, titanium, mocha */
/* eslint no-unused-expressions: "off" */
/* eslint node/no-unsupported-features/node-builtins: "off" */
'use strict';
var should = require('./utilities/assertions'); // eslint-disable-line no-unused-vars
var path;

describe('path', function () {
	it('should be required as core module', function () {
		path = require('path');
		path.should.be.an.Object();
	});

	it('.posix provides access to posix specific variant', function () {
		path.posix.should.be.an.Object();
	});

	it('.win32 provides access to windows specific variant', function () {
		path.win32.should.be.an.Object();
	});

	describe('#basename()', function () {
		it('is a function', function () {
			path.basename.should.be.a.Function();
		});

		it('ignores win32 separators on posix', function () {
			path.posix.basename('C:\\temp\\myfile.html').should.eql('C:\\temp\\myfile.html');
		});

		it('handles win32 separators on win32', function () {
			path.win32.basename('C:\\temp\\myfile.html').should.eql('myfile.html');
		});

		it('handles forward slash root win32 absolute filepath', function () {
			path.win32.basename('//server').should.eql('server');
		});

		it('handles backward slash root win32 absolute filepath', function () {
			path.win32.basename('\\\\server').should.eql('server');
		});

		it('handles full UNC style path on win32', function () {
			path.win32.basename('\\\\host-name\\share-name\\file_path').should.eql('file_path');
		});

		it('handles win32 with mixed separators and trailing forward slash', function () {
			path.win32.basename('C:\\my/dir/with\\wacky\\paths/').should.eql('paths');
		});

		it('handles forward slash win32 root filepath', function () {
			path.win32.basename('//').should.eql('');
		});

		it('handles typical win32 root filepath', function () {
			path.win32.basename('C:\\').should.eql('');
		});

		it('handles typical win32 root filepath with no trailing separator', function () {
			path.win32.basename('C:').should.eql('');
		});

		it('handles backward slash win32 root filepath', function () {
			path.win32.basename('\\\\').should.eql('');
		});

		it('handles posix separators on posix', function () {
			path.posix.basename('/tmp/myfile.html').should.eql('myfile.html');
		});

		it('drops extension when matches', function () {
			path.posix.basename('/foo/bar/baz/asdf/quux.html', '.html').should.eql('quux');
		});

		it('drops extension when matches even without leading period in specified ext', function () {
			path.posix.basename('index.html.html', 'html').should.eql('index.html.');
		});

		it('does not drop extension when it does not match', function () {
			path.posix.basename('index.htm', 'html').should.eql('index.htm');
		});

		it('ignores trailing separator when checking extension', function () {
			path.posix.basename('index.html/', 'html').should.eql('index.');
			path.posix.basename('index/.html/', 'html').should.eql('.');
		});

		it('throws TypeError when ext argument is not a string', function () {
			(function () {
				path.basename('foo.html', 123);
			}).should.throw(TypeError, { message: 'The "ext" argument must be of type string. Received type number' });
		});
		// TODO: What about / separators on windows?!
	});

	describe('.delimiter', function () {
		it('is a String', function () {
			path.delimiter.should.be.a.String();
		});

		it('is ; on windows', function () {
			path.win32.delimiter.should.eql(';');
		});

		it('is : on posix', function () {
			path.posix.delimiter.should.eql(':');
		});
	});

	describe('#join()', function () {
		it('is a function', function () {
			path.join.should.be.a.Function();
		});

		it('returns "." if path ends up empty string', function () {
			path.posix.join('').should.eql('.');
		});

		it('joins paths with posix file separator', function () {
			path.posix.join('/foo', 'bar', 'baz/asdf', 'quux').should.eql('/foo/bar/baz/asdf/quux');
		});

		it('normalizes path after joining', function () {
			path.posix.join('/foo', 'bar', 'baz/asdf', 'quux', '..').should.eql('/foo/bar/baz/asdf');
		});

		it('throws TypeError when segment is not a string', function () {
			(function () {
				path.join('foo', {}, 'bar');
			}).should.throw(TypeError);
			// FIXME: Message doesn't match because we don't have util.inspect to spit out the value properly yet!
			// }).should.throw(TypeError, { message: 'Path must be a string. Received {}' });
		});
	});

	describe('#extname()', function () {
		it('is a function', function () {
			path.extname.should.be.a.Function();
		});

		it('return extension when one period', function () {
			path.extname('index.html').should.eql('.html');
		});

		it('returns last extension when two periods', function () {
			path.extname('index.coffee.md').should.eql('.md');
		});

		it('returns . file ends in period', function () {
			path.extname('index.').should.eql('.');
		});

		it('returns empty string when file has no period', function () {
			path.extname('index').should.eql('');
		});

		it('returns empty string when filename starts with period', function () {
			path.extname('.index').should.eql('');
		});

		it('ignores trailing separator when checking extension', function () {
			path.posix.extname('index.html/').should.eql('.html');
		});

		it('handles full UNC style path on win32', function () {
			path.win32.extname('\\\\host-name\\share-name\\file_path.txt').should.eql('.txt');
		});
	});

	describe('#normalize()', function () {
		it('is a function', function () {
			path.normalize.should.be.a.Function();
		});

		it('handles posix separators', function () {
			path.posix.normalize('/foo/bar//baz/asdf/quux/..').should.eql('/foo/bar/baz/asdf');
		});

		it('retains trailing separator', function () {
			path.posix.normalize('/foo/bar//baz/asdf/').should.eql('/foo/bar/baz/asdf/');
		});

		it('handles win32 separators', function () {
			path.win32.normalize('C:\\temp\\\\foo\\bar\\..\\').should.eql('C:\\temp\\foo\\');
		});

		it('handles full UNC style path on win32', function () {
			path.win32.normalize('\\\\host-name\\share-name\\file_path').should.eql('\\\\host-name\\share-name\\file_path');
		});

		it('handles multiple win32 separators and replaces with preferred', function () {
			path.win32.normalize('C:////temp\\\\/\\/\\/foo/bar').should.eql('C:\\temp\\foo\\bar');
		});

		it('throws TypeError when segment is not a string', function () {
			(function () {
				path.normalize(1);
			}).should.throw(TypeError, { message: 'The "path" argument must be of type string. Received type number' });
		});
	});

	describe('#dirname()', function () {
		it('is a function', function () {
			path.dirname.should.be.a.Function();
		});

		it('handles typical posix path', function () {
			path.posix.dirname('/foo/bar/baz/asdf/quux').should.eql('/foo/bar/baz/asdf');
		});

		it('handles root posix path', function () {
			path.posix.dirname('/').should.eql('/');
		});

		it('handles root unc posix path', function () {
			path.posix.dirname('//a').should.eql('//');
		});

		it('handles unc-looking path with no other characters', function () {
			path.posix.dirname('//').should.eql('/');
		});

		it('handles posix path with no separators', function () {
			path.posix.dirname('abcd').should.eql('.');
		});

		it('ignores trailing separator', function () {
			path.posix.dirname('/foo/bar/baz/asdf/quux/').should.eql('/foo/bar/baz/asdf');
		});

		it('handles typical win32 path', function () {
			path.win32.dirname('C:\\temp\\foo').should.eql('C:\\temp');
		});

		it('handles typical win32 path ignoring trailing separator', function () {
			path.win32.dirname('C:\\temp\\foo\\').should.eql('C:\\temp');
		});

		it('handles typical root win32 path', function () {
			path.win32.dirname('C:\\').should.eql('C:\\');
		});

		it('handles full UNC style path on win32', function () {
			path.win32.dirname('\\\\host-name\\share-name\\file_path').should.eql('\\\\host-name\\share-name'); // FIXME: node leaves trailing separator!
		});

		it('handles empty string', function () {
			path.posix.dirname('').should.eql('.');
			path.win32.dirname('').should.eql('.');
		});

		it('throws TypeError when path is not a string', function () {
			(function () {
				path.dirname(1);
			}).should.throw(TypeError, { message: 'The "path" argument must be of type string. Received type number' });
		});
	});

	describe('#isAbsolute()', function () {
		it('is a function', function () {
			path.isAbsolute.should.be.a.Function();
		});

		it('returns false for empty string', function () {
			path.isAbsolute('').should.eql(false);
		});

		// POSIX
		it('returns true for typical posix absolute path', function () {
			path.posix.isAbsolute('/foo/bar').should.eql(true);
		});

		it('returns true for posix absolute path with .. segment', function () {
			path.posix.isAbsolute('/baz/..').should.eql(true);
		});

		it('returns false for typical posix relative path', function () {
			path.posix.isAbsolute('qux/').should.eql(false);
		});

		it('returns false for posix path "."', function () {
			path.posix.isAbsolute('.').should.eql(false);
		});

		// Windows
		it('returns true for win32 UNC absolute path', function () {
			path.win32.isAbsolute('//server').should.eql(true);
		});

		it('returns true for win32 server absolute path', function () {
			path.win32.isAbsolute('\\\\server').should.eql(true);
		});

		it('handles full UNC style path on win32', function () {
			path.win32.isAbsolute('\\\\host-name\\share-name\\file_path').should.eql(true);
		});

		it('returns true for win32 absolute path with POSIX separators', function () {
			path.win32.isAbsolute('C:/foo/..').should.eql(true);
		});

		it('returns true for typical win32 absolute path', function () {
			path.win32.isAbsolute('C:\\foo\\..').should.eql(true);
		});

		it('returns false for typical win32 relative path', function () {
			path.win32.isAbsolute('bar\\baz').should.eql(false);
		});

		it('returns false for win32 relative path with POSIX separators', function () {
			path.win32.isAbsolute('bar/baz').should.eql(false);
		});

		it('returns false for win32 path "."', function () {
			path.win32.isAbsolute('.').should.eql(false);
		});

		it('throws TypeError when path is not a string', function () {
			(function () {
				path.isAbsolute(1);
			}).should.throw(TypeError, { message: 'The "path" argument must be of type string. Received type number' });
		});
	});

	describe('#relative()', function () {
		it('is a function', function () {
			path.relative.should.be.a.Function();
		});

		// POSIX
		it('handles two root posix paths', function () {
			path.posix.relative('/data/orandea/test/aaa', '/data/orandea/impl/bbb').should.eql('../../impl/bbb');
		});

		it('returns empty string for two equivalent posix paths', function () {
			path.posix.relative('/data/orandea/test/aaa/../..', '/data/orandea/impl/..').should.eql('');
		});

		// Windows
		it('handles two typical root win32 paths', function () {
			path.win32.relative('C:\\orandea\\test\\aaa', 'C:\\orandea\\impl\\bbb').should.eql('..\\..\\impl\\bbb');
		});

		it('throws TypeError when "from" argument is not a string', function () {
			(function () {
				path.relative(1, 'to');
			}).should.throw(TypeError, { message: 'The "from" argument must be of type string. Received type number' });
		});

		it('throws TypeError when "to" argument is not a string', function () {
			(function () {
				path.relative('from', 1);
			}).should.throw(TypeError, { message: 'The "to" argument must be of type string. Received type number' });
		});
	});

	describe('#resolve()', function () {
		it('is a function', function () {
			path.resolve.should.be.a.Function();
		});

		it('resolves relative path on top of absolute with posix file separator', function () {
			path.posix.resolve('/foo/bar', './baz').should.eql('/foo/bar/baz');
		});

		it('resolves to posix root path and does not remove trailing separator', function () {
			path.posix.resolve('/foo/bar', '../..').should.eql('/');
		});

		it('resolves up to first absolute path', function () {
			path.posix.resolve('/foo/bar', '/tmp/file/').should.eql('/tmp/file');
		});

		it('resolves relative to cwd if doesn\'t produce absolute path', function () {
			const originalCwd = process.cwd;
			try {
				process.cwd = function () {
					return __dirname;
				};
				path.posix.resolve('wwwroot', 'static_files/png/', '../gif/image.gif').should.eql(path.posix.join(__dirname, 'wwwroot/static_files/gif/image.gif'));
			} finally {
				process.cwd = originalCwd;
			}
		});

		it('resolves relative path to typical absolute win32 path', function () {
			path.win32.resolve('C:\\orandea\\test\\aaa', 'bbb').should.eql('C:\\orandea\\test\\aaa\\bbb');
		});

		it('resolves up to first absolute path on win32', function () {
			path.win32.resolve('C:\\orandea\\test\\aaa', 'C:\\orandea\\impl\\bbb').should.eql('C:\\orandea\\impl\\bbb');
		});

		it('resolves to root win32 path and does not remove trailing separator', function () {
			path.win32.resolve('C:\\orandea\\', '..').should.eql('C:\\');
		});

		it('throws TypeError when segment is not a string', function () {
			(function () {
				path.resolve('/foo', {}, 'bar');
			}).should.throw(TypeError);
			// FIXME: Message doesn't match because we don't have util.inspect to spit out the value properly yet!
			// }).should.throw(TypeError, { message: 'Path must be a string. Received {}' });
		});
	});

	describe('#parse()', function () {
		it('is a function', function () {
			path.parse.should.be.a.Function();
		});

		it('parses typical posix filepath', function () {
			const result = path.posix.parse('/home/user/dir/file.txt');
			result.should.have.property('root').which.eql('/');
			result.should.have.property('dir').which.eql('/home/user/dir');
			result.should.have.property('base').which.eql('file.txt');
			result.should.have.property('ext').which.eql('.txt');
			result.should.have.property('name').which.eql('file');
		});

		it('parses typical posix root filepath', function () {
			const result = path.posix.parse('/');
			result.should.have.property('root').which.eql('/');
			result.should.have.property('dir').which.eql('/');
			result.should.have.property('base').which.eql('');
			result.should.have.property('ext').which.eql('');
			result.should.have.property('name').which.eql('');
		});

		it('parses "./" posix filepath', function () {
			const result = path.posix.parse('./');
			result.should.have.property('root').which.eql('');
			result.should.have.property('dir').which.eql('');
			result.should.have.property('base').which.eql('.');
			result.should.have.property('ext').which.eql('');
			result.should.have.property('name').which.eql('.');
		});

		it('parses relative posix filepath with extension', function () {
			const result = path.posix.parse('abc/d.txt');
			result.should.have.property('root').which.eql('');
			result.should.have.property('dir').which.eql('abc');
			result.should.have.property('base').which.eql('d.txt');
			result.should.have.property('ext').which.eql('.txt');
			result.should.have.property('name').which.eql('d');
		});

		it('parses relative posix filepath with .. and . in middle', function () {
			const result = path.posix.parse('abc/123/.././d.txt');
			result.should.have.property('root').which.eql('');
			result.should.have.property('dir').which.eql('abc/123/../.');
			result.should.have.property('base').which.eql('d.txt');
			result.should.have.property('ext').which.eql('.txt');
			result.should.have.property('name').which.eql('d');
		});

		// TODO: Test relative paths on win32

		it('parses typical win32 filepath', function () {
			const result = path.win32.parse('C:\\path\\dir\\file.txt');
			result.should.have.property('root').which.eql('C:\\');
			result.should.have.property('dir').which.eql('C:\\path\\dir');
			result.should.have.property('base').which.eql('file.txt');
			result.should.have.property('ext').which.eql('.txt');
			result.should.have.property('name').which.eql('file');
		});

		it('parses typical win32 root filepath', function () {
			const result = path.win32.parse('C:\\');
			result.should.have.property('root').which.eql('C:\\');
			result.should.have.property('dir').which.eql('C:\\');
			result.should.have.property('base').which.eql('');
			result.should.have.property('ext').which.eql('');
			result.should.have.property('name').which.eql('');
		});

		it('parses win32 root filepath with no trailing separator', function () {
			const result = path.win32.parse('C:');
			result.should.have.property('root').which.eql('C:');
			result.should.have.property('dir').which.eql('C:');
			result.should.have.property('base').which.eql('');
			result.should.have.property('ext').which.eql('');
			result.should.have.property('name').which.eql('');
		});

		it('parses win32 server root', function () {
			const result = path.win32.parse('\\\\server');
			result.should.have.property('root').which.eql('\\');
			result.should.have.property('dir').which.eql('\\');
			result.should.have.property('base').which.eql('server');
			result.should.have.property('ext').which.eql('');
			result.should.have.property('name').which.eql('server');
		});

		it('parses win32 root filepath with forward slash', function () {
			const result = path.win32.parse('//server');
			result.should.have.property('root').which.eql('/');
			result.should.have.property('dir').which.eql('/');
			result.should.have.property('base').which.eql('server');
			result.should.have.property('ext').which.eql('');
			result.should.have.property('name').which.eql('server');
		});

		it('returns object with empty string values for empty filepath', function () {
			const result = path.parse('');
			result.should.have.property('root').which.eql('');
			result.should.have.property('dir').which.eql('');
			result.should.have.property('base').which.eql('');
			result.should.have.property('ext').which.eql('');
			result.should.have.property('name').which.eql('');
		});

		// FIXME: Our implementation drops trailing separators on UNC roots
		it.allBroken('handles full UNC style path on win32', function () {
			const result = path.win32.parse('\\\\host-name\\share-name\\file_path');
			result.should.have.property('root').which.eql('\\\\host-name\\share-name\\');
			result.should.have.property('dir').which.eql('\\\\host-name\\share-name\\');
			result.should.have.property('base').which.eql('file_path');
			result.should.have.property('ext').which.eql('');
			result.should.have.property('name').which.eql('file_path');
		});

		it('throws TypeError when path is not a string', function () {
			(function () {
				path.parse(123);
			}).should.throw(TypeError, { message: 'The "path" argument must be of type string. Received type number' });
		});
	});

	describe('#format()', function () {
		it('is a function', function () {
			path.format.should.be.a.Function();
		});

		it('parses typical posix filepath', function () {
			const obj = {
				root: '/',
				dir: '/home/user/dir',
				base: 'file.txt',
				ext: '.txt',
				name: 'file'
			};
			path.posix.format(obj).should.eql('/home/user/dir/file.txt');
		});

		it('parses typical posix root filepath', function () {
			const obj = {
				root: '/',
				dir: '/',
				base: '',
				ext: '',
				name: ''
			};
			path.posix.format(obj).should.eql('/');
		});

		it('parses "./" posix filepath', function () {
			const obj = {
				root: '',
				dir: '',
				base: '.',
				ext: '',
				name: '.'
			};
			path.posix.format(obj).should.eql('.');
		});

		it('parses relative posix filepath with extension', function () {
			const obj = {
				root: '',
				dir: 'abc',
				base: 'd.txt',
				ext: '.txt',
				name: 'd'
			};
			path.posix.format(obj).should.eql('abc/d.txt');
		});

		it('parses relative posix filepath with .. and . in middle', function () {
			const obj = {
				root: '',
				dir: 'abc/123/../.',
				base: 'd.txt',
				ext: '.txt',
				name: 'd'
			};
			path.posix.format(obj).should.eql('abc/123/.././d.txt');
		});

		it('parses typical win32 filepath', function () {
			const obj = {
				root: 'C:\\',
				dir: 'C:\\path\\dir',
				base: 'file.txt',
				ext: '.txt',
				name: 'file'
			};
			path.win32.format(obj).should.eql('C:\\path\\dir\\file.txt');
		});

		it('parses typical win32 root filepath', function () {
			const obj = {
				root: 'C:\\',
				dir: 'C:\\',
				base: '',
				ext: '',
				name: ''
			};
			path.win32.format(obj).should.eql('C:\\');
		});

		it('parses win32 root filepath with no trailing separator', function () {
			const obj = {
				root: 'C:',
				dir: 'C:',
				base: '',
				ext: '',
				name: ''
			};
			path.win32.format(obj).should.eql('C:');
		});

		it('parses win32 server root', function () {
			const obj = {
				root: '\\',
				dir: '\\',
				base: 'server',
				ext: '',
				name: 'server'
			};
			path.win32.format(obj).should.eql('\\server');
		});

		it('parses win32 root filepath with forward slash', function () {
			const obj = {
				root: '/',
				dir: '/',
				base: 'server',
				ext: '',
				name: 'server'
			};
			path.win32.format(obj).should.eql('/server');
		});

		it('returns empty string for empty object', function () {
			path.win32.format({}).should.eql('');
		});

		// TODO: Add tests for priority of properties defined in docs!

		it('throws TypeError when pathObject is not an object', function () {
			(function () {
				path.format(123);
			}).should.throw(TypeError, { message: 'The "pathObject" argument must be of type object. Received type number' });
		});
	});

	describe('#toNamespacedPath()', function () {
		it('is a function', function () {
			path.toNamespacedPath.should.be.a.Function();
		});

		it('returns path unmodified on posix', function () {
			path.posix.toNamespacedPath('/some/path').should.eql('/some/path');
		});

		it('returns path unmodified on win32 when path is not a string', function () {
			path.win32.toNamespacedPath(123).should.eql(123);
		});

		it('returns equivalent namespace-prefixed path for UNC path', function () {
			path.win32.toNamespacedPath('\\\\host-name\\share-name\\file_path').should.eql('\\\\?\\UNC\\host-name\\share-name\\file_path');
		});

		it('returns equivalent namespace-prefixed path for typical win32 device root absolute path', function () {
			path.win32.toNamespacedPath('C:\\').should.eql('\\\\?\\C:\\');
		});

		it('returns path as-is if already a namespace-prefixed path', function () {
			path.win32.toNamespacedPath('\\\\?\\UNC\\host-name\\share-name\\file_path').should.eql('\\\\?\\UNC\\host-name\\share-name\\file_path');
		});

		it('returns empty string for empty string', function () {
			path.win32.toNamespacedPath('').should.eql('');
		});
	});
});

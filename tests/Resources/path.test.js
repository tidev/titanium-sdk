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
		should(path).be.an.Object();
	});

	it('.posix provides access to posix specific variant', function () {
		should(path.posix).be.an.Object();
	});

	it('.win32 provides access to windows specific variant', function () {
		should(path.win32).be.an.Object();
	});

	describe('#basename()', function () {
		it('is a function', function () {
			should(path.basename).be.a.Function();
		});

		it('ignores win32 separators on posix', function () {
			should(path.posix.basename('C:\\temp\\myfile.html')).eql('C:\\temp\\myfile.html');
		});

		it('handles win32 separators on win32', function () {
			should(path.win32.basename('C:\\temp\\myfile.html')).eql('myfile.html');
		});

		it('handles forward slash root win32 absolute filepath', function () {
			should(path.win32.basename('//server')).eql('server');
		});

		it('handles backward slash root win32 absolute filepath', function () {
			should(path.win32.basename('\\\\server')).eql('server');
		});

		it('handles full UNC style path on win32', function () {
			should(path.win32.basename('\\\\host-name\\share-name\\file_path')).eql('file_path');
		});

		it('handles win32 with mixed separators and trailing forward slash', function () {
			should(path.win32.basename('C:\\my/dir/with\\wacky\\paths/')).eql('paths');
		});

		it('handles forward slash win32 root filepath', function () {
			should(path.win32.basename('//')).eql('');
		});

		it('handles typical win32 root filepath', function () {
			should(path.win32.basename('C:\\')).eql('');
		});

		it('handles typical win32 root filepath with no trailing separator', function () {
			should(path.win32.basename('C:')).eql('');
		});

		it('handles backward slash win32 root filepath', function () {
			should(path.win32.basename('\\\\')).eql('');
		});

		it('handles posix separators on posix', function () {
			should(path.posix.basename('/tmp/myfile.html')).eql('myfile.html');
		});

		it('drops extension when matches', function () {
			should(path.posix.basename('/foo/bar/baz/asdf/quux.html', '.html')).eql('quux');
		});

		it('drops extension when matches even without leading period in specified ext', function () {
			should(path.posix.basename('index.html.html', 'html')).eql('index.html.');
		});

		it('does not drop extension when it does not match', function () {
			should(path.posix.basename('index.htm', 'html')).eql('index.htm');
		});

		it('ignores trailing separator when checking extension', function () {
			should(path.posix.basename('index.html/', 'html')).eql('index.');
			should(path.posix.basename('index/.html/', 'html')).eql('.');
		});

		it('throws TypeError when ext argument is not a string', function () {
			should(function () {
				path.basename('foo.html', 123);
			}).throw(TypeError, { message: 'The "ext" argument must be of type string. Received type number' });
		});
		// TODO: What about / separators on windows?!
	});

	describe('.delimiter', function () {
		it('is a String', function () {
			should(path.delimiter).be.a.String();
		});

		it('is ; on windows', function () {
			should(path.win32.delimiter).eql(';');
		});

		it('is : on posix', function () {
			should(path.posix.delimiter).eql(':');
		});
	});

	describe('#join()', function () {
		it('is a function', function () {
			should(path.join).be.a.Function();
		});

		it('returns "." if path ends up empty string', function () {
			should(path.posix.join('')).eql('.');
		});

		it('joins paths with posix file separator', function () {
			should(path.posix.join('/foo', 'bar', 'baz/asdf', 'quux')).eql('/foo/bar/baz/asdf/quux');
		});

		it('normalizes path after joining', function () {
			should(path.posix.join('/foo', 'bar', 'baz/asdf', 'quux', '..')).eql('/foo/bar/baz/asdf');
		});

		it('throws TypeError when segment is not a string', function () {
			should(function () {
				path.join('foo', {}, 'bar');
			}).throw(TypeError);
			// FIXME: Message doesn't match because we don't have util.inspect to spit out the value properly yet!
			// should(})).throw(TypeError, { message: 'Path must be a string. Received {}' });
		});
	});

	describe('#extname()', function () {
		it('is a function', function () {
			should(path.extname).be.a.Function();
		});

		it('return extension when one period', function () {
			should(path.extname('index.html')).eql('.html');
		});

		it('returns last extension when two periods', function () {
			should(path.extname('index.coffee.md')).eql('.md');
		});

		it('returns . file ends in period', function () {
			should(path.extname('index.')).eql('.');
		});

		it('returns empty string when file has no period', function () {
			should(path.extname('index')).eql('');
		});

		it('returns empty string when filename starts with period', function () {
			should(path.extname('.index')).eql('');
		});

		it('ignores trailing separator when checking extension', function () {
			should(path.posix.extname('index.html/')).eql('.html');
		});

		it('handles full UNC style path on win32', function () {
			should(path.win32.extname('\\\\host-name\\share-name\\file_path.txt')).eql('.txt');
		});
	});

	describe('#normalize()', function () {
		it('is a function', function () {
			should(path.normalize).be.a.Function();
		});

		it('handles posix separators', function () {
			should(path.posix.normalize('/foo/bar//baz/asdf/quux/..')).eql('/foo/bar/baz/asdf');
		});

		it('retains trailing separator', function () {
			should(path.posix.normalize('/foo/bar//baz/asdf/')).eql('/foo/bar/baz/asdf/');
		});

		it('handles win32 separators', function () {
			should(path.win32.normalize('C:\\temp\\\\foo\\bar\\..\\')).eql('C:\\temp\\foo\\');
		});

		it('handles full UNC style path on win32', function () {
			should(path.win32.normalize('\\\\host-name\\share-name\\file_path')).eql('\\\\host-name\\share-name\\file_path');
		});

		it('handles multiple win32 separators and replaces with preferred', function () {
			should(path.win32.normalize('C:////temp\\\\/\\/\\/foo/bar')).eql('C:\\temp\\foo\\bar');
		});

		it('throws TypeError when segment is not a string', function () {
			should(function () {
				path.normalize(1);
			}).throw(TypeError, { message: 'The "path" argument must be of type string. Received type number' });
		});
	});

	describe('#dirname()', function () {
		it('is a function', function () {
			should(path.dirname).be.a.Function();
		});

		it('handles typical posix path', function () {
			should(path.posix.dirname('/foo/bar/baz/asdf/quux')).eql('/foo/bar/baz/asdf');
		});

		it('handles root posix path', function () {
			should(path.posix.dirname('/')).eql('/');
		});

		it('handles root unc posix path', function () {
			should(path.posix.dirname('//a')).eql('//');
		});

		it('handles unc-looking path with no other characters', function () {
			should(path.posix.dirname('//')).eql('/');
		});

		it('handles posix path with no separators', function () {
			should(path.posix.dirname('abcd')).eql('.');
		});

		it('ignores trailing separator', function () {
			should(path.posix.dirname('/foo/bar/baz/asdf/quux/')).eql('/foo/bar/baz/asdf');
		});

		it('handles typical win32 path', function () {
			should(path.win32.dirname('C:\\temp\\foo')).eql('C:\\temp');
		});

		it('handles typical win32 path ignoring trailing separator', function () {
			should(path.win32.dirname('C:\\temp\\foo\\')).eql('C:\\temp');
		});

		it('handles typical root win32 path', function () {
			should(path.win32.dirname('C:\\')).eql('C:\\');
		});

		it('handles full UNC style path on win32', function () {
			should(path.win32.dirname('\\\\host-name\\share-name\\file_path')).eql('\\\\host-name\\share-name'); // FIXME: node leaves trailing separator!
		});

		it('handles empty string', function () {
			should(path.posix.dirname('')).eql('.');
			should(path.win32.dirname('')).eql('.');
		});

		it('throws TypeError when path is not a string', function () {
			should(function () {
				path.dirname(1);
			}).throw(TypeError, { message: 'The "path" argument must be of type string. Received type number' });
		});
	});

	describe('#isAbsolute()', function () {
		it('is a function', function () {
			should(path.isAbsolute).be.a.Function();
		});

		it('returns false for empty string', function () {
			should(path.isAbsolute('')).be.false();
		});

		// POSIX
		it('returns true for typical posix absolute path', function () {
			should(path.posix.isAbsolute('/foo/bar')).be.true();
		});

		it('returns true for posix absolute path with .. segment', function () {
			should(path.posix.isAbsolute('/baz/..')).be.true();
		});

		it('returns false for typical posix relative path', function () {
			should(path.posix.isAbsolute('qux/')).be.false();
		});

		it('returns false for posix path "."', function () {
			should(path.posix.isAbsolute('.')).be.false();
		});

		// Windows
		it('returns true for win32 UNC absolute path', function () {
			should(path.win32.isAbsolute('//server')).be.true();
		});

		it('returns true for win32 server absolute path', function () {
			should(path.win32.isAbsolute('\\\\server')).be.true();
		});

		it('handles full UNC style path on win32', function () {
			should(path.win32.isAbsolute('\\\\host-name\\share-name\\file_path')).be.true();
		});

		it('returns true for win32 absolute path with POSIX separators', function () {
			should(path.win32.isAbsolute('C:/foo/..')).be.true();
		});

		it('returns true for typical win32 absolute path', function () {
			should(path.win32.isAbsolute('C:\\foo\\..')).be.true();
		});

		it('returns false for typical win32 relative path', function () {
			should(path.win32.isAbsolute('bar\\baz')).be.false();
		});

		it('returns false for win32 relative path with POSIX separators', function () {
			should(path.win32.isAbsolute('bar/baz')).be.false();
		});

		it('returns false for win32 path "."', function () {
			should(path.win32.isAbsolute('.')).be.false();
		});

		it('throws TypeError when path is not a string', function () {
			should(function () {
				path.isAbsolute(1);
			}).throw(TypeError, { message: 'The "path" argument must be of type string. Received type number' });
		});
	});

	describe('#relative()', function () {
		it('is a function', function () {
			should(path.relative).be.a.Function();
		});

		// POSIX
		it('handles two root posix paths', function () {
			should(path.posix.relative('/data/orandea/test/aaa', '/data/orandea/impl/bbb')).eql('../../impl/bbb');
		});

		it('returns empty string for two equivalent posix paths', function () {
			should(path.posix.relative('/data/orandea/test/aaa/../..', '/data/orandea/impl/..')).eql('');
		});

		// Windows
		it('handles two typical root win32 paths', function () {
			should(path.win32.relative('C:\\orandea\\test\\aaa', 'C:\\orandea\\impl\\bbb')).eql('..\\..\\impl\\bbb');
		});

		it('throws TypeError when "from" argument is not a string', function () {
			should(function () {
				path.relative(1, 'to');
			}).throw(TypeError, { message: 'The "from" argument must be of type string. Received type number' });
		});

		it('throws TypeError when "to" argument is not a string', function () {
			should(function () {
				path.relative('from', 1);
			}).throw(TypeError, { message: 'The "to" argument must be of type string. Received type number' });
		});
	});

	describe('#resolve()', function () {
		it('is a function', function () {
			should(path.resolve).be.a.Function();
		});

		it('resolves relative path on top of absolute with posix file separator', function () {
			should(path.posix.resolve('/foo/bar', './baz')).eql('/foo/bar/baz');
		});

		it('resolves to posix root path and does not remove trailing separator', function () {
			should(path.posix.resolve('/foo/bar', '../..')).eql('/');
		});

		it('resolves up to first absolute path', function () {
			should(path.posix.resolve('/foo/bar', '/tmp/file/')).eql('/tmp/file');
		});

		it('resolves relative to cwd if doesn\'t produce absolute path', function () {
			const originalCwd = process.cwd;
			try {
				process.cwd = function () {
					return __dirname;
				};
				should(path.posix.resolve('wwwroot', 'static_files/png/', '../gif/image.gif')).eql(path.posix.join(__dirname, 'wwwroot/static_files/gif/image.gif'));
			} finally {
				process.cwd = originalCwd;
			}
		});

		it('resolves relative path to typical absolute win32 path', function () {
			should(path.win32.resolve('C:\\orandea\\test\\aaa', 'bbb')).eql('C:\\orandea\\test\\aaa\\bbb');
		});

		it('resolves up to first absolute path on win32', function () {
			should(path.win32.resolve('C:\\orandea\\test\\aaa', 'C:\\orandea\\impl\\bbb')).eql('C:\\orandea\\impl\\bbb');
		});

		it('resolves to root win32 path and does not remove trailing separator', function () {
			should(path.win32.resolve('C:\\orandea\\', '..')).eql('C:\\');
		});

		it('throws TypeError when segment is not a string', function () {
			should(function () {
				path.resolve('/foo', {}, 'bar');
			}).throw(TypeError);
			// FIXME: Message doesn't match because we don't have util.inspect to spit out the value properly yet!
			// }).throw(TypeError, { message: 'Path must be a string. Received {}' });
		});
	});

	describe('#parse()', function () {
		it('is a function', function () {
			should(path.parse).be.a.Function();
		});

		it('parses typical posix filepath', function () {
			const result = path.posix.parse('/home/user/dir/file.txt');
			should(result).have.property('root').which.eql('/');
			should(result).have.property('dir').which.eql('/home/user/dir');
			should(result).have.property('base').which.eql('file.txt');
			should(result).have.property('ext').which.eql('.txt');
			should(result).have.property('name').which.eql('file');
		});

		it('parses typical posix root filepath', function () {
			const result = path.posix.parse('/');
			should(result).have.property('root').which.eql('/');
			should(result).have.property('dir').which.eql('/');
			should(result).have.property('base').which.eql('');
			should(result).have.property('ext').which.eql('');
			should(result).have.property('name').which.eql('');
		});

		it('parses "./" posix filepath', function () {
			const result = path.posix.parse('./');
			should(result).have.property('root').which.eql('');
			should(result).have.property('dir').which.eql('');
			should(result).have.property('base').which.eql('.');
			should(result).have.property('ext').which.eql('');
			should(result).have.property('name').which.eql('.');
		});

		it('parses relative posix filepath with extension', function () {
			const result = path.posix.parse('abc/d.txt');
			should(result).have.property('root').which.eql('');
			should(result).have.property('dir').which.eql('abc');
			should(result).have.property('base').which.eql('d.txt');
			should(result).have.property('ext').which.eql('.txt');
			should(result).have.property('name').which.eql('d');
		});

		it('parses relative posix filepath with .. and . in middle', function () {
			const result = path.posix.parse('abc/123/.././d.txt');
			should(result).have.property('root').which.eql('');
			should(result).have.property('dir').which.eql('abc/123/../.');
			should(result).have.property('base').which.eql('d.txt');
			should(result).have.property('ext').which.eql('.txt');
			should(result).have.property('name').which.eql('d');
		});

		// TODO: Test relative paths on win32

		it('parses typical win32 filepath', function () {
			const result = path.win32.parse('C:\\path\\dir\\file.txt');
			should(result).have.property('root').which.eql('C:\\');
			should(result).have.property('dir').which.eql('C:\\path\\dir');
			should(result).have.property('base').which.eql('file.txt');
			should(result).have.property('ext').which.eql('.txt');
			should(result).have.property('name').which.eql('file');
		});

		it('parses typical win32 root filepath', function () {
			const result = path.win32.parse('C:\\');
			should(result).have.property('root').which.eql('C:\\');
			should(result).have.property('dir').which.eql('C:\\');
			should(result).have.property('base').which.eql('');
			should(result).have.property('ext').which.eql('');
			should(result).have.property('name').which.eql('');
		});

		it('parses win32 root filepath with no trailing separator', function () {
			const result = path.win32.parse('C:');
			should(result).have.property('root').which.eql('C:');
			should(result).have.property('dir').which.eql('C:');
			should(result).have.property('base').which.eql('');
			should(result).have.property('ext').which.eql('');
			should(result).have.property('name').which.eql('');
		});

		it('parses win32 server root', function () {
			const result = path.win32.parse('\\\\server');
			should(result).have.property('root').which.eql('\\');
			should(result).have.property('dir').which.eql('\\');
			should(result).have.property('base').which.eql('server');
			should(result).have.property('ext').which.eql('');
			should(result).have.property('name').which.eql('server');
		});

		it('parses win32 root filepath with forward slash', function () {
			const result = path.win32.parse('//server');
			should(result).have.property('root').which.eql('/');
			should(result).have.property('dir').which.eql('/');
			should(result).have.property('base').which.eql('server');
			should(result).have.property('ext').which.eql('');
			should(result).have.property('name').which.eql('server');
		});

		it('returns object with empty string values for empty filepath', function () {
			const result = path.parse('');
			should(result).have.property('root').which.eql('');
			should(result).have.property('dir').which.eql('');
			should(result).have.property('base').which.eql('');
			should(result).have.property('ext').which.eql('');
			should(result).have.property('name').which.eql('');
		});

		// FIXME: Our implementation drops trailing separators on UNC roots
		it.allBroken('handles full UNC style path on win32', function () {
			const result = path.win32.parse('\\\\host-name\\share-name\\file_path');
			should(result).have.property('root').which.eql('\\\\host-name\\share-name\\');
			should(result).have.property('dir').which.eql('\\\\host-name\\share-name\\');
			should(result).have.property('base').which.eql('file_path');
			should(result).have.property('ext').which.eql('');
			should(result).have.property('name').which.eql('file_path');
		});

		it('throws TypeError when path is not a string', function () {
			should(function () {
				path.parse(123);
			}).throw(TypeError, { message: 'The "path" argument must be of type string. Received type number' });
		});
	});

	describe('#format()', function () {
		it('is a function', function () {
			should(path.format).be.a.Function();
		});

		it('parses typical posix filepath', function () {
			const obj = {
				root: '/',
				dir: '/home/user/dir',
				base: 'file.txt',
				ext: '.txt',
				name: 'file'
			};
			should(path.posix.format(obj)).eql('/home/user/dir/file.txt');
		});

		it('parses typical posix root filepath', function () {
			const obj = {
				root: '/',
				dir: '/',
				base: '',
				ext: '',
				name: ''
			};
			should(path.posix.format(obj)).eql('/');
		});

		it('parses "./" posix filepath', function () {
			const obj = {
				root: '',
				dir: '',
				base: '.',
				ext: '',
				name: '.'
			};
			should(path.posix.format(obj)).eql('.');
		});

		it('parses relative posix filepath with extension', function () {
			const obj = {
				root: '',
				dir: 'abc',
				base: 'd.txt',
				ext: '.txt',
				name: 'd'
			};
			should(path.posix.format(obj)).eql('abc/d.txt');
		});

		it('parses relative posix filepath with .. and . in middle', function () {
			const obj = {
				root: '',
				dir: 'abc/123/../.',
				base: 'd.txt',
				ext: '.txt',
				name: 'd'
			};
			should(path.posix.format(obj)).eql('abc/123/.././d.txt');
		});

		it('parses typical win32 filepath', function () {
			const obj = {
				root: 'C:\\',
				dir: 'C:\\path\\dir',
				base: 'file.txt',
				ext: '.txt',
				name: 'file'
			};
			should(path.win32.format(obj)).eql('C:\\path\\dir\\file.txt');
		});

		it('parses typical win32 root filepath', function () {
			const obj = {
				root: 'C:\\',
				dir: 'C:\\',
				base: '',
				ext: '',
				name: ''
			};
			should(path.win32.format(obj)).eql('C:\\');
		});

		it('parses win32 root filepath with no trailing separator', function () {
			const obj = {
				root: 'C:',
				dir: 'C:',
				base: '',
				ext: '',
				name: ''
			};
			should(path.win32.format(obj)).eql('C:');
		});

		it('parses win32 server root', function () {
			const obj = {
				root: '\\',
				dir: '\\',
				base: 'server',
				ext: '',
				name: 'server'
			};
			should(path.win32.format(obj)).eql('\\server');
		});

		it('parses win32 root filepath with forward slash', function () {
			const obj = {
				root: '/',
				dir: '/',
				base: 'server',
				ext: '',
				name: 'server'
			};
			should(path.win32.format(obj)).eql('/server');
		});

		it('returns empty string for empty object', function () {
			should(path.win32.format({})).eql('');
		});

		// TODO: Add tests for priority of properties defined in docs!

		it('throws TypeError when pathObject is not an object', function () {
			should(function () {
				path.format(123);
			}).throw(TypeError, { message: 'The "pathObject" argument must be of type object. Received type number' });
		});
	});

	describe('#toNamespacedPath()', function () {
		it('is a function', function () {
			should(path.toNamespacedPath).be.a.Function();
		});

		it('returns path unmodified on posix', function () {
			should(path.posix.toNamespacedPath('/some/path')).eql('/some/path');
		});

		it('returns path unmodified on win32 when path is not a string', function () {
			should(path.win32.toNamespacedPath(123)).eql(123);
		});

		it('returns equivalent namespace-prefixed path for UNC path', function () {
			should(path.win32.toNamespacedPath('\\\\host-name\\share-name\\file_path')).eql('\\\\?\\UNC\\host-name\\share-name\\file_path');
		});

		it('returns equivalent namespace-prefixed path for typical win32 device root absolute path', function () {
			should(path.win32.toNamespacedPath('C:\\')).eql('\\\\?\\C:\\');
		});

		it('returns path as-is if already a namespace-prefixed path', function () {
			should(path.win32.toNamespacedPath('\\\\?\\UNC\\host-name\\share-name\\file_path')).eql('\\\\?\\UNC\\host-name\\share-name\\file_path');
		});

		it('returns empty string for empty string', function () {
			should(path.win32.toNamespacedPath('')).eql('');
		});
	});
});

/**
 * node-appc - Appcelerator Common Library for Node.js
 * Copyright (c) 2009-2014 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

var appc = require('../index');

describe('progress', function () {
	it('namespace exists', function () {
		appc.should.have.property('progress');
		appc.progress.should.be.a.Function;
	});

	it('should render progress bar', function (done) {
		this.slow('3s');

		var origWrite = process.stdout.write,
			origCursorTo = process.stdout.cursorTo || function () {},
			buffer = '';

		process.stdout.write = function (s) {
			buffer += s + '\n';
		};

		process.stdout.cursorTo = function () {};

		var bar = new appc.progress(':paddedPercent [:bar] :current of :total (:percent)', {
			complete: '=',
			incomplete: '.',
			width: 40,
			total: 10
		});

		var timer = setInterval(function(){
			bar.tick();
			if (bar.complete) {
				clearInterval(timer);
				process.stdout.write = origWrite;
				process.stdout.cursorTo = origCursorTo;

				buffer.should.equal(
					' 10% [====....................................] 1 of 10 (10%) \n' +
					' 20% [========................................] 2 of 10 (20%) \n' +
					' 30% [============............................] 3 of 10 (30%) \n' +
					' 40% [================........................] 4 of 10 (40%) \n' +
					' 50% [====================....................] 5 of 10 (50%) \n' +
					' 60% [========================................] 6 of 10 (60%) \n' +
					' 70% [============================............] 7 of 10 (70%) \n' +
					' 80% [================================........] 8 of 10 (80%) \n' +
					' 90% [====================================....] 9 of 10 (90%) \n' +
					'100% [========================================] 10 of 10 (100%) \n'
				);

				done();
			}
		}, 100);
	});

	it('should render progress bar with swapped tick() params', function (done) {
		this.slow('3s');

		var origWrite = process.stdout.write,
			origCursorTo = process.stdout.cursorTo || function () {},
			buffer = '';

		process.stdout.write = function (s) {
			buffer += s + '\n';
		};

		process.stdout.cursorTo = function () {};

		var bar = new appc.progress(':paddedPercent [:bar] :current of :total (:percent)', {
			complete: '=',
			incomplete: '.',
			width: 40,
			total: 10
		});

		var timer = setInterval(function(){
			bar.tick({}, 1);
			if (bar.complete) {
				clearInterval(timer);
				process.stdout.write = origWrite;
				process.stdout.cursorTo = origCursorTo;

				buffer.should.equal(
					' 10% [====....................................] 1 of 10 (10%) \n' +
					' 20% [========................................] 2 of 10 (20%) \n' +
					' 30% [============............................] 3 of 10 (30%) \n' +
					' 40% [================........................] 4 of 10 (40%) \n' +
					' 50% [====================....................] 5 of 10 (50%) \n' +
					' 60% [========================................] 6 of 10 (60%) \n' +
					' 70% [============================............] 7 of 10 (70%) \n' +
					' 80% [================================........] 8 of 10 (80%) \n' +
					' 90% [====================================....] 9 of 10 (90%) \n' +
					'100% [========================================] 10 of 10 (100%) \n'
				);

				done();
			}
		}, 100);
	});

	it('should render custom tokens', function (done) {
		this.slow('3s');

		var origWrite = process.stdout.write,
			origCursorTo = process.stdout.cursorTo || function () {},
			buffer = '';

		process.stdout.write = function (s) {
			buffer += s + '\n';
		};

		process.stdout.cursorTo = function () {};

		var bar = new appc.progress(':paddedPercent [:bar] :decimal', {
			complete: '=',
			incomplete: '.',
			width: 40,
			total: 10
		});

		var timer = setInterval(function(){
			bar.tick(1, {
				decimal: ((bar.curr + 1) / bar.total).toFixed(1)
			});
			if (bar.complete) {
				clearInterval(timer);
				process.stdout.write = origWrite;
				process.stdout.cursorTo = origCursorTo;

				buffer.should.equal(
					' 10% [====....................................] 0.1 \n' +
					' 20% [========................................] 0.2 \n' +
					' 30% [============............................] 0.3 \n' +
					' 40% [================........................] 0.4 \n' +
					' 50% [====================....................] 0.5 \n' +
					' 60% [========================................] 0.6 \n' +
					' 70% [============================............] 0.7 \n' +
					' 80% [================================........] 0.8 \n' +
					' 90% [====================================....] 0.9 \n' +
					'100% [========================================] 1.0 \n'
				);

				done();
			}
		}, 100);
	});
});

/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2015-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
const should = require('./utilities/assertions');

describe.ios('Titanium.UI.iOS', () => {
	it('#createCollisionBehavior()', () => {
		should(Titanium.UI.iOS.createCollisionBehavior).be.a.Function();
	});
});

describe.ios('Titanium.UI.iOS.CollisionBehavior', () => {
	it('.apiName', () => {
		const collision = Titanium.UI.iOS.createCollisionBehavior();
		should(collision).have.readOnlyProperty('apiName').which.is.a.String();
		should(collision.apiName).eql('Ti.UI.iOS.CollisionBehavior');
	});

	describe('.boundaryIdentifiers', () => {
		it('is an Array',  () => {
			const collision = Titanium.UI.iOS.createCollisionBehavior();
			should(collision).have.a.property('boundaryIdentifiers').which.is.an.Array();
		});

		// TODO: test read-only, default value, etc
	});

	describe('.collisionMode', () => {
		it('is a Number',  () => {
			const collision = Titanium.UI.iOS.createCollisionBehavior();
			should(collision).have.a.property('collisionMode').which.is.a.Number();
		});

		it('defaults to Titanium.UI.iOS.COLLISION_MODE_ALL',  () => {
			const collision = Titanium.UI.iOS.createCollisionBehavior();
			should(collision.collisionMode).eql(Titanium.UI.iOS.COLLISION_MODE_ALL);
		});
	});

	describe('.items', () => {
		it('is an Array',  () => {
			const collision = Titanium.UI.iOS.createCollisionBehavior();
			should(collision).have.a.property('items').which.is.an.Array();
		});

		// TODO: test read-only, default value, etc
	});

	describe('.referenceInsets', () => {
		it('is an Object',  () => {
			const collision = Titanium.UI.iOS.createCollisionBehavior();
			should(collision).have.a.property('referenceInsets').which.is.an.Object();
		});

		// TODO: add some sort of test for Padding object type?

		it('defaults to all zeroes',  () => {
			const collision = Titanium.UI.iOS.createCollisionBehavior();
			should(collision.referenceInsets.top).eql(0);
			should(collision.referenceInsets.bottom).eql(0);
			should(collision.referenceInsets.left).eql(0);
			should(collision.referenceInsets.right).eql(0);
		});

		// TODO: test setting some values and they persist
	});

	describe('.treatReferenceAsBoundary', () => {
		it('is a Boolean',  () => {
			const collision = Titanium.UI.iOS.createCollisionBehavior();
			should(collision).have.a.property('treatReferenceAsBoundary').which.is.a.Boolean();
		});

		it('defaults to true',  () => {
			const collision = Titanium.UI.iOS.createCollisionBehavior();
			should(collision.treatReferenceAsBoundary).be.true();
		});
	});

	describe('#addBoundary', () => {
		it('is a Function',  () => {
			const collision = Titanium.UI.iOS.createCollisionBehavior();
			should(collision).have.a.property('addBoundary').which.is.a.Function();
		});
	});

	describe('#addItem', () => {
		it('is a Function',  () => {
			const collision = Titanium.UI.iOS.createCollisionBehavior();
			should(collision).have.a.property('addItem').which.is.a.Function();
		});
	});

	describe('#removeAllBoundaries', () => {
		it('is a Function',  () => {
			const collision = Titanium.UI.iOS.createCollisionBehavior();
			should(collision).have.a.property('removeAllBoundaries').which.is.a.Function();
		});
	});

	describe('#removeBoundary', () => {
		it('is a Function',  () => {
			const collision = Titanium.UI.iOS.createCollisionBehavior();
			should(collision).have.a.property('removeBoundary').which.is.a.Function();
		});
	});

	describe('#removeItem', () => {
		it('is a Function',  () => {
			const collision = Titanium.UI.iOS.createCollisionBehavior();
			should(collision).have.a.property('removeItem').which.is.a.Function();
		});
	});

	describe('example', function () {
		let win;

		this.slow(2000);
		this.timeout(15000);

		afterEach(done => { // fires after every test in sub-suites too...
			if (win && !win.closed) {
				win.addEventListener('close', function listener () {
					win.removeEventListener('close', listener);
					win = null;
					done();
				});
				win.close();
			} else {
				win = null;
				done();
			}
		});

		it('works', finish => {
			win = Ti.UI.createWindow({
				backgroundColor: 'white',
				fullscreen: true
			});

			// Create an Animator object using the window as the coordinate system
			const animator = Ti.UI.iOS.createAnimator({ referenceView: win });

			// Create a default collision behavior, using the window edges as boundaries
			const collision = Ti.UI.iOS.createCollisionBehavior();

			// After 3 boundary collitions and 5 item collisions end the test
			let boundaryCount = 0;
			let itemCount = 0;
			let done = false;
			function itemListener() {
				itemCount++;
				console.log(`${itemCount} item collisons`);
				checkDone();
			}
			function boundaryListener() {
				boundaryCount++;
				console.log(`${boundaryCount} boundary collisons`);
				checkDone();
			}
			function checkDone() {
				if (itemCount < 3 || boundaryCount < 5 || done) {
					return;
				}
				done = true;
				collision.removeEventListener('itemcollision', itemListener);
				collision.removeEventListener('boundarycollision', boundaryListener);
				finish();
			}
			collision.addEventListener('itemcollision', itemListener);
			collision.addEventListener('boundarycollision', boundaryListener);

			// Simulate Earth's gravity
			const gravity = Ti.UI.iOS.createGravityBehavior({
				gravityDirection: { x: 0.0, y: 1.0 }
			});

			const WIDTH = Ti.Platform.displayCaps.platformWidth;
			const HEIGHT = Ti.Platform.displayCaps.platformHeight;
			const BLOCK_WIDTH = 25;
			const BLOCK_HEIGHT = 25;

			// Create a bunch of random blocks; add to the window and behaviors
			const blocks = [];
			for (var i = 0; i < 25; i++) {
				const r = Math.round(Math.random() * 255);
				const g = Math.round(Math.random() * 255);
				const b = Math.round(Math.random() * 255);
				const rgb = `rgb(${r},${g},${b})`;

				blocks[i] = Ti.UI.createView({
					width: BLOCK_WIDTH,
					height: BLOCK_HEIGHT,
					top: Math.round(Math.random() * (HEIGHT / 4) + BLOCK_HEIGHT), // somewhere in top 1/4 of screen
					left: Math.round(Math.random() * (WIDTH - BLOCK_WIDTH)), // anywhere in horizontal area of screen
					backgroundColor: rgb
				});
				win.add(blocks[i]);
				collision.addItem(blocks[i]);
				gravity.addItem(blocks[i]);
			}

			animator.addBehavior(collision);
			animator.addBehavior(gravity);

			// Start the animation when the window opens
			win.addEventListener('open', function openListener(_e) {
				win.removeEventListener('open', openListener);
				animator.startAnimator();
			});

			win.open();
		});
	});
});

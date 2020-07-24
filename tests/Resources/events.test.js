/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
const should = require('./utilities/assertions');
const util = require('util');

let EventEmitter;

describe('EventEmitter', () => {
	it('should be available as a core module', () => {
		EventEmitter = require('events');
		should(EventEmitter).be.ok;
	});

	describe('#emit()', () => {
		it('is a function', () => {
			const e = new EventEmitter();
			should(e.emit).be.a.Function();
		});

		it('fires to listeners in order added', () => {
			const e = new EventEmitter();
			const fires = [];
			e.addListener('ping', () => {
				fires.push(1);
			});
			e.addListener('ping', () => {
				fires.push(2);
			});
			e.addListener('ping', () => {
				fires.push(3);
			});
			e.addListener('ping', () => {
				fires.push(4);
			});
			e.emit('ping');
			fires.should.eql([ 1, 2, 3, 4 ]);
		});

		it('fires to listeners in order added with one removed', () => {
			const e = new EventEmitter();
			const fires = [];
			e.addListener('ping', () => {
				fires.push(1);
			});
			e.addListener('ping', () => {
				fires.push(2);
			});
			const three = () => {
				fires.push(3);
			};
			e.addListener('ping', three);
			e.addListener('ping', () => {
				fires.push(4);
			});
			e.removeListener('ping', three);
			e.emit('ping');
			fires.should.eql([ 1, 2, 4 ]);
		});

		it('fires to listeners in order added, with prependListener jumping the line', () => {
			const e = new EventEmitter();
			const fires = [];
			e.addListener('ping', () => {
				fires.push(1);
			});
			e.addListener('ping', () => {
				fires.push(2);
			});
			e.prependListener('ping', () => {
				fires.push(3);
			});
			e.prependListener('ping', () => {
				fires.push(4);
			});
			e.emit('ping');
			fires.should.eql([ 4, 3, 1, 2 ]);
		});

		it('passes along arguments to listener', () => {
			const e = new EventEmitter();
			const fires = [];
			e.addListener('ping', (one, two, three, four) => {
				fires.push(one, two, three, four);
			});
			e.emit('ping', 1, '2', /three/, { four: 4 });
			fires.should.eql([ 1, '2', /three/, { four: 4 } ]);
		});

		it('sets `this` to emitter inside listener', () => {
			const e = new EventEmitter();
			let listenerThis;
			e.addListener('ping', function () {
				listenerThis = this;
			});
			e.emit('ping');
			listenerThis.should.eql(e);
		});
	});

	describe('#eventNames()', () => {
		it('is a function', () => {
			const e = new EventEmitter();
			should(e.eventNames).be.a.Function();
		});

		it('initially returns empty array', () => {
			const e = new EventEmitter();
			const eventNames = e.eventNames();
			should(eventNames).be.an.Array();
			eventNames.should.have.length(0);
		});

		it('returns array of unique event names', () => { // this is hanging!
			const e = new EventEmitter();
			const noop = () => {};
			e.on('ping', noop);
			e.once('pong', noop);
			e.addListener('foo', noop);
			const eventNames = e.eventNames();
			eventNames.should.have.length(3);
			eventNames[0].should.eql('ping');
			eventNames[1].should.eql('pong');
			eventNames[2].should.eql('foo');

			// remove listeners and see if it removes event name (if that was only listener)
			e.removeListener('ping', noop);
			const eventNames2 = e.eventNames();
			eventNames2.should.have.length(2);
			eventNames2[0].should.eql('pong');
			eventNames2[1].should.eql('foo');

			// emit for event with one once listener, verify that event name disappears
			e.emit('pong');
			const eventNames3 = e.eventNames();
			eventNames3.should.have.length(1);
			eventNames3[0].should.eql('foo');
		});
	});

	describe('#on()', () => {
		it('is a function', () => {
			const e = new EventEmitter();
			should(e.on).be.a.Function();
		});

		it('is called multiple times via multiple emits', finished => {
			const e = new EventEmitter();
			let callCount = 0;
			e.on('ping', () => {
				callCount++;
			});
			e.emit('ping');
			e.emit('ping');
			e.emit('ping');
			e.emit('ping');
			setTimeout(() => {
				try {
					callCount.should.eql(4);
					finished();
				} catch (err) {
					finished(err);
				}
			}, 10);
		});
	});

	describe('#addListener()', () => {
		it('is a function', () => {
			const e = new EventEmitter();
			should(e.addListener).be.a.Function();
		});

		it('is called multiple times via multiple emits', () => {
			const e = new EventEmitter();
			let callCount = 0;
			e.addListener('ping', () => {
				callCount++;
			});
			e.emit('ping');
			e.emit('ping');
			e.emit('ping');
			e.emit('ping');
			callCount.should.eql(4);
		});
	});

	describe('#once()', () => {
		it('is a function', () => {
			const e = new EventEmitter();
			should(e.once).be.a.Function();
		});

		it('is called only once despite multiple emits', finished => {
			const e = new EventEmitter();
			let callCount = 0;
			e.once('ping', () => {
				callCount++;
			});
			e.emit('ping');
			e.emit('ping');
			e.emit('ping');
			e.emit('ping');
			setTimeout(() => {
				try {
					callCount.should.eql(1); // fails here, gives us 4
					finished();
				} catch (err) {
					finished(err);
				}
			}, 10);
		});

		it('can be removed by removeListener', () => {
			const e = new EventEmitter();
			const noop = () => {};
			e.once('ping', noop);
			e.listenerCount('ping').should.eql(1);
			e.removeListener('ping', noop);
			e.listenerCount('ping').should.eql(0);
		});

		it('does not interfere with other listeners when removing itself', () => {
			// special test case for bug that occurred when iterating over original listener array
			// while firing events. This basically tests that we copy listener array before iterating
			// if we didn't iterator gets confused and second listener never gets event
			const e = new EventEmitter();
			let callCount = 0;
			e.once('ping', () => {
				callCount++;
			});
			e.on('ping', () => {
				callCount++;
			});
			e.listenerCount('ping').should.eql(2);
			e.emit('ping'); // emit shoudl fire to *both* listeners and remove the first once listener
			e.listenerCount('ping').should.eql(1);
			callCount.should.eql(2);
		});
	});

	describe('#listenerCount()', () => {
		it('is a function', () => {
			const e = new EventEmitter();
			should(e.listenerCount).be.a.Function();
		});

		it('returns 0 for event name with no listeners', () => {
			const e = new EventEmitter();
			should(e.listenerCount('fake')).be.eql(0);
		});

		it('returns array of unique event names', () => {
			const e = new EventEmitter();
			const noop = () => {};
			should(e.listenerCount('ping')).be.eql(0);
			e.on('ping', noop);
			should(e.listenerCount('ping')).be.eql(1);

			should(e.listenerCount('pong')).be.eql(0);
			e.once('pong', noop);
			should(e.listenerCount('pong')).be.eql(1);

			should(e.listenerCount('foo')).be.eql(0);
			e.addListener('foo', noop);
			should(e.listenerCount('foo')).be.eql(1);
			e.addListener('foo', noop);
			should(e.listenerCount('foo')).be.eql(2);
			e.addListener('foo', noop);
			should(e.listenerCount('foo')).be.eql(3);

			// remove listener and ensure count goes down
			e.removeListener('foo', noop);
			should(e.listenerCount('foo')).be.eql(2);

			// emit for event with one once listener, verify that count goes down
			e.emit('pong');
			should(e.listenerCount('pong')).be.eql(0); // fails now, due to bad once handling
		});
	});

	describe('#off()', () => {
		it('is a function', () => {
			const e = new EventEmitter();
			should(e.off).be.a.Function();
		});
	});

	describe('#removeListener()', () => {
		it('is a function', () => {
			const e = new EventEmitter();
			should(e.removeListener).be.a.Function();
		});

		it('properly removes listener added via addListener', () => {
			const e = new EventEmitter();
			let callCount = 0;
			const counter = () => {
				callCount++;
			};
			e.addListener('ping', counter);
			e.emit('ping');
			e.removeListener('ping', counter);
			e.emit('ping');
			e.emit('ping');
			e.emit('ping');
			callCount.should.eql(1);
		});

		it('does not throw when removing listener that was never added', () => {
			const e = new EventEmitter();
			e.removeListener('ping', () => {});
		});
	});

	describe('#removeAllListeners()', () => {
		it('is a function', () => {
			const e = new EventEmitter();
			should(e.removeAllListeners).be.a.Function();
		});

		it('with no argument removes for all event types', () => {
			const e = new EventEmitter();
			e.addListener('ping', () => {});
			e.once('pong', () => {});
			e.on('foo', () => {});
			const eventNames = e.eventNames();
			eventNames.should.be.an.Array();
			eventNames.should.have.length(3);
			eventNames.should.eql([ 'ping', 'pong', 'foo' ]);
			e.removeAllListeners();
			const eventNames2 = e.eventNames();
			eventNames2.should.be.an.Array();
			eventNames2.should.have.length(0);
		});

		it('with argument removes for specific event type', () => {
			const e = new EventEmitter();
			e.addListener('ping', () => {});
			e.once('ping', () => {});
			e.once('pong', () => {});
			e.on('foo', () => {});
			e.listenerCount('ping').should.eql(2);
			const eventNames = e.eventNames();
			eventNames.should.be.an.Array();
			eventNames.should.have.length(3);
			eventNames.should.eql([ 'ping', 'pong', 'foo' ]);
			e.removeAllListeners('ping');
			const eventNames2 = e.eventNames();
			eventNames2.should.be.an.Array();
			eventNames2.should.have.length(2);
			eventNames2.should.eql([ 'pong', 'foo' ]);
			e.listenerCount('ping').should.eql(0);
		});
	});

	describe('#prependListener()', () => {
		it('is a function', () => {
			const e = new EventEmitter();
			should(e.prependListener).be.a.Function();
		});
	});

	describe('#prependOnceListener()', () => {
		it('is a function', () => {
			const e = new EventEmitter();
			should(e.prependOnceListener).be.a.Function();
		});
	});

	describe('#setMaxListeners()', () => {
		it('is a function', () => {
			const e = new EventEmitter();
			should(e.setMaxListeners).be.a.Function();
		});
	});

	describe('#getMaxListeners()', () => {
		it('is a function', () => {
			const e = new EventEmitter();
			should(e.getMaxListeners).be.a.Function();
		});
	});

	describe('#rawListeners()', () => {
		it('is a function', () => {
			const e = new EventEmitter();
			should(e.rawListeners).be.a.Function();
		});

		it('does not unwrap once listeners', () => {
			const e = new EventEmitter();
			const listener1 = () => {};
			const listener2 = arg => arg;
			e.addListener('ping', listener1);
			e.once('ping', listener2);
			const listeners = e.rawListeners('ping');
			listeners.should.not.eql([ listener1, listener2 ]);
		});
	});

	describe('#listeners()', () => {
		it('is a function', () => {
			const e = new EventEmitter();
			should(e.listeners).be.a.Function();
		});

		it('unwraps once listeners', () => {
			const e = new EventEmitter();
			const listener1 = () => {};
			const listener2 = arg => arg;
			e.addListener('ping', listener1);
			e.once('ping', listener2);
			const listeners = e.listeners('ping');
			listeners.should.eql([ listener1, listener2 ]);
		});
	});

	describe('newListener event', () => {
		it('is emitted when listeners are added', () => {
			const e = new EventEmitter();
			const listenerFirings = [];
			e.addListener('newListener', eventName => listenerFirings.push(eventName));
			e.addListener('ping', () => {});
			e.once('pong', () => {});
			listenerFirings.should.eql([ 'ping', 'pong' ]);
		});
	});

	describe('removeListener event', () => {
		it('is emitted when listeners are removed', () => {
			const e = new EventEmitter();
			const listenerFirings = [];
			e.addListener('removeListener', eventName => listenerFirings.push(eventName));
			const noop = () => {};
			e.addListener('ping', noop);
			e.once('pong', () => {});
			e.emit('pong');
			listenerFirings.should.eql([ 'pong' ]);
			e.off('ping', noop);
			listenerFirings.should.eql([ 'pong', 'ping' ]);
		});

		it('handles removing a removeListener properly', () => {
			const e = new EventEmitter();
			const listenerFirings = [];
			const recordEvents = eventName => listenerFirings.push(eventName);
			e.addListener('removeListener', recordEvents);
			const shouldNeverGetInvoked = () => {
				should.fail('a removeListener should not get invoked when it itself is removed');
			};
			e.addListener('removeListener', shouldNeverGetInvoked);
			e.off('removeListener', shouldNeverGetInvoked);
			listenerFirings.should.eql([ 'removeListener' ]);
		});
	});

	it('handles being extended by util.inherits with constructor chaining', () => {
		function Subclass() {
		}

		util.inherits(Subclass, EventEmitter);
		const e = new Subclass();
		const listenerFirings = [];
		e.addListener('newListener', eventName => listenerFirings.push(eventName));
		e.addListener('ping', () => {});
		e.once('pong', () => {});
		listenerFirings.should.eql([ 'ping', 'pong' ]);
	});

	// TODO: test registering for and receiving newListener removeListener events baked in
	// - specifically to test we do not go into infinite recursion
	// - also to test other code path in removeAllListeners
	// TODO: test modifying max listeners, falling back to EventEmitter.defaultMaxListeners;
	// TODO: test that we emit warning when > max listeners registered!
});

/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2017 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
import './utilities/assertions';

describe('ES6 Arrows', function () {

	it('expression bodies', function () {
		const evens = [ 0, 2, 4, 6, 8 ];
		const odds = evens.map(v => v + 1);
		odds.should.have.length(5);
		odds.should.containEql(1);
		odds.should.containEql(3);
		odds.should.containEql(5);
		odds.should.containEql(7);
		odds.should.containEql(9);

		const nums = evens.map((v, i) => v + i);
		nums.should.have.length(5);
		nums.should.containEql(0);
		nums.should.containEql(3);
		nums.should.containEql(6);
		nums.should.containEql(9);
		nums.should.containEql(12);

		evens.map(v => ({ even: v, odd: v + 1 }));

		//   // Statement bodies
		//   nums.forEach(v => {
		//     if (v % 5 === 0)
		//       fives.push(v);
		//   });
		//
		//   // Lexical this
		//   var bob = {
		//     _name: "Bob",
		//     _friends: [],
		//     printFriends() {
		//       this._friends.forEach(f =>
		//         console.log(this._name + " knows " + f));
		//     }
		//   }
	});
});

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
		should(odds).have.length(5);
		should(odds).containEql(1);
		should(odds).containEql(3);
		should(odds).containEql(5);
		should(odds).containEql(7);
		should(odds).containEql(9);

		const nums = evens.map((v, i) => v + i);
		should(nums).have.length(5);
		should(nums).containEql(0);
		should(nums).containEql(3);
		should(nums).containEql(6);
		should(nums).containEql(9);
		should(nums).containEql(12);

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

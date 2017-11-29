/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

var should = require('./utilities/assertions'),
	utilities = require('./utilities/utilities');

describe('Titanium.Media', function () {
	it('#createVideoPlayer()', function () {
		should(Ti.Media.createVideoPlayer).be.a.Function;
	});
});

describe('Titanium.Media.VideoPlayer', function () {
	it('apiName', function () {
		var player = Ti.Media.createVideoPlayer();
		should(player).have.readOnlyProperty('apiName').which.is.a.String;
		should(player.apiName).be.eql('Ti.Media.VideoPlayer');
	});

	it('playing', function () {
		var player = Ti.Media.createVideoPlayer();
		should(player).have.readOnlyProperty('playing').which.is.a.Boolean;
	});

	it('scalingMode', function () {
		var player = Ti.Media.createVideoPlayer();
		if (utilities.isIOS()) {
			should(player.scalingMode).be.a.String;
		} else {
			should(player.scalingMode).be.a.Number;
		}
	});

	it.ios('allowsAirPlay', function () {
		var player = Ti.Media.createVideoPlayer();
		should(player.allowsAirPlay).be.a.Boolean;
	});

	it.ios('autoplay', function () {
		var player = Ti.Media.createVideoPlayer();
		should(player.autoplay).be.a.Boolean;
	});

	it.ios('volume', function () {
		var player = Ti.Media.createVideoPlayer();
		should(player.volume).be.a.Number;
	});

	it.ios('pictureInPictureEnabled', function () {
		var player = Ti.Media.createVideoPlayer();
		should(player.pictureInPictureEnabled).be.a.Boolean;
	});

	it.ios('showsControls', function () {
		var player = Ti.Media.createVideoPlayer();
		should(player.showsControls).be.a.Boolean;
	});

	it.ios('playableDuration', function () {
		var player = Ti.Media.createVideoPlayer();
		should(player).have.readOnlyProperty('playableDuration').which.is.a.Number;
	});

	it.ios('duration', function () {
		var player = Ti.Media.createVideoPlayer();
		should(player).have.readOnlyProperty('duration').which.is.a.Number;
	});

	it('currentPlaybackTime', function () {
		var player = Ti.Media.createVideoPlayer();
		should(player.currentPlaybackTime).be.a.Number;
	});

	it.ios('endPlaybackTime', function () {
		var player = Ti.Media.createVideoPlayer();
		should(player.endPlaybackTime).be.a.Number;
	});

	it.ios('moviePlayerStatus', function () {
		var player = Ti.Media.createVideoPlayer();
		should(player).have.readOnlyProperty('moviePlayerStatus').which.is.a.Number;
	});
});


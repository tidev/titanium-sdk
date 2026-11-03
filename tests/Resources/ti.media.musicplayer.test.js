/*
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
/* eslint no-undef: "off" */
'use strict';

const should = require('./utilities/assertions');

describe.ios('Titanium.Media.MusicPlayer', () => {
	let instance;

	beforeEach(() => {
		instance = Ti.Media.appMusicPlayer;
	});

	afterEach(() => {
		instance = null;
	});

	describe('.apiName', () => {
		it('is a String', () => {
			should(instance).have.a.readOnlyProperty('apiName').which.is.a.String();
		});

		it('equals Ti.Media.MusicPlayer', () => {
			should(instance.apiName).eql('Ti.Media.MusicPlayer');
		});
	});

	describe('.currentPlaybackTime', () => {
		it('is a Number', () => {
			should(instance).have.a.property('currentPlaybackTime').which.is.a.Number();
		});
	});

	describe('.nowPlaying', () => {
		it('is an Object', () => {
			should(instance).have.a.readOnlyProperty('nowPlaying').which.is.an.Object();
		});

		// TODO: Test that it's a Ti.Media.Item when actually playing
	});

	describe('.playbackState', () => {
		it('is a Number', () => {
			should(instance).have.a.readOnlyProperty('playbackState').which.is.a.Number();
		});

		it('is one of Ti.Media.MUSIC_PLAYER_STATE_*', () => {
			should([
				Ti.Media.MUSIC_PLAYER_STATE_INTERRUPTED,
				Ti.Media.MUSIC_PLAYER_STATE_PAUSED,
				Ti.Media.MUSIC_PLAYER_STATE_PLAYING,
				Ti.Media.MUSIC_PLAYER_STATE_SEEK_BACKWARD,
				Ti.Media.MUSIC_PLAYER_STATE_SEEK_FORWARD,
				Ti.Media.MUSIC_PLAYER_STATE_STOPPED,
			]).containEql(instance.playbackState);
		});
	});

	describe('.repeatMode', () => {
		it('is a Number', () => {
			should(instance).have.a.property('repeatMode').which.is.a.Number();
		});

		it('is one of Ti.Media.MUSIC_PLAYER_REPEAT_*', () => {
			should([
				Ti.Media.MUSIC_PLAYER_REPEAT_ALL,
				Ti.Media.MUSIC_PLAYER_REPEAT_DEFAULT,
				Ti.Media.MUSIC_PLAYER_REPEAT_NONE,
				Ti.Media.MUSIC_PLAYER_REPEAT_ONE,
			]).containEql(instance.repeatMode);
		});
	});

	describe('.shuffleMode', () => {
		it('is a Number', () => {
			should(instance).have.a.property('shuffleMode').which.is.a.Number();
		});

		it('is one of Ti.Media.MUSIC_PLAYER_SHUFFLE_*', () => {
			should([
				Ti.Media.MUSIC_PLAYER_SHUFFLE_ALBUMS,
				Ti.Media.MUSIC_PLAYER_SHUFFLE_DEFAULT,
				Ti.Media.MUSIC_PLAYER_SHUFFLE_NONE,
				Ti.Media.MUSIC_PLAYER_SHUFFLE_SONGS,
			]).containEql(instance.shuffleMode);
		});
	});

	describe('#pause', () => {
		it('is a Function', () => {
			should(instance.pause).be.a.Function();
		});
	});

	describe('#play', () => {
		it('is a Function', () => {
			should(instance.play).be.a.Function();
		});
	});

	describe('#seekBackward', () => {
		it('is a Function', () => {
			should(instance.seekBackward).be.a.Function();
		});
	});

	describe('#seekForward', () => {
		it('is a Function', () => {
			should(instance.seekForward).be.a.Function();
		});
	});

	describe('#setQueue', () => {
		it('is a Function', () => {
			should(instance.setQueue).be.a.Function();
		});
	});

	describe('#skipToBeginning', () => {
		it('is a Function', () => {
			should(instance.skipToBeginning).be.a.Function();
		});
	});

	describe('#skipToNext', () => {
		it('is a Function', () => {
			should(instance.skipToNext).be.a.Function();
		});
	});

	describe('#skipToPrevious', () => {
		it('is a Function', () => {
			should(instance.skipToPrevious).be.a.Function();
		});
	});

	describe('#stop', () => {
		it('is a Function', () => {
			should(instance.stop).be.a.Function();
		});
	});

	describe('#stopSeeking', () => {
		it('is a Function', () => {
			should(instance.stopSeeking).be.a.Function();
		});
	});

});

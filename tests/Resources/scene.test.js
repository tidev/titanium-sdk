/*
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
'use strict';
const should = require('./utilities/assertions');

describe('Ti.App.iOS scenes', function () {
	before(function () {
		if (!Ti.App.iOS.currentScene) {
			this.skip();
		}
	});

	it('exposes a bound current scene and a stable registry proxy', function () {
		const scene = Ti.App.iOS.currentScene;
		should(scene.apiName).eql('Ti.App.iOS.SceneProxy');
		should(scene.sceneId).be.a.String();
		should(scene.id).eql(scene.sceneId);
		should(scene.addEventListener).be.a.Function();
		should(scene.isActive).be.a.Boolean();
		should(scene.isForeground).be.a.Boolean();
		should(Ti.App.iOS.scenes.find(item => item.sceneId === scene.sceneId)).equal(scene);
		should(Ti.App.iOS.currentScene).equal(scene);
	});

	it('returns the root window without throwing', function () {
		should(Ti.App.iOS.currentScene.window.apiName).eql('Ti.UI.Window');
	});

	it('uses the same scene proxy through a window', function (done) {
		const win = Ti.UI.createWindow();
		win.addEventListener('open', function () {
			let failure;
			try {
				should(win.scene).equal(Ti.App.iOS.currentScene);
				should(win.scene).equal(win.scene);
			} catch (error) {
				failure = error;
			}
			win.addEventListener('close', function () {
				done(failure);
			});
			win.close({ animated: false });
		});
		win.open();
	});

	it('rejects unavailable scene configurations without creating a window', function () {
		const count = Ti.App.iOS.scenes.length;
		return Ti.App.iOS.requestScene({ configurationName: '__missing_scene_configuration__' }).then(function () {
			throw new Error('requestScene should reject an unavailable configuration');
		}, function (error) {
			should(error.message).be.a.String();
			should(Ti.App.iOS.scenes.length).eql(count);
		});
	});
});

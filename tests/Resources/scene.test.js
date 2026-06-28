/*
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
'use strict';
const should = require('./utilities/assertions');

// Multi-scene tests require iOS 13+ and a platform that supports multiple
// windows (iPad simulator recommended). On iPhone the newly-requested scene
// may not become active without user interaction, so the second test's
// focus assertion is most reliable on iPad.

describe('Ti.App.iOS scenes', function () {
  this.timeout(30000);

  const isIOS = Ti.Platform.osname === 'iphone' || Ti.Platform.osname === 'ipad';
  const hasRequestScene = isIOS && typeof Ti.App.iOS.requestScene === 'function';

  it('requestScene resolves with a SceneProxy', function () {
    if (!hasRequestScene) {
      this.skip();
      return;
    }
    return Ti.App.iOS.requestScene().then(function (e) {
      should(e).be.an.Object();
      should(e.scene).be.an.Object();
      should(e.scene).have.property('apiName', 'Ti.App.iOS.SceneProxy');
      should(e.scene).have.property('sceneId');
    });
  });

  it('per-scene focus fires on the SceneProxy', function () {
    if (!hasRequestScene) {
      this.skip();
      return;
    }
    return Ti.App.iOS.requestScene().then(function (e) {
      const scene = e.scene;
      return new Promise(function (resolve, reject) {
        let fired = false;
        scene.addEventListener('focus', function (evt) {
          if (fired) {
            return;
          }
          fired = true;
          try {
            should(evt).have.property('sceneId');
            should(evt.scene).be.exactly(scene);
            scene.removeEventListener('focus', this);
            resolve();
          } catch (err) {
            reject(err);
          }
        });
        // On iPad the new window typically becomes key automatically, firing
        // focus. On iPhone this may require user interaction with
        // the new scene.
      });
    });
  });
});
/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* global Ti */
/* eslint no-unused-expressions: "off" */
'use strict';
var should = require('./utilities/assertions'),
  utilities = require('./utilities/utilities');

describe('Titanium.Media.VideoPlayer', function() {
  it.ios('Close window containing a video player (TIMOB-25574)', function() {
    var win = Titanium.UI.createWindow();

    var nav = Titanium.UI.iOS.createNavigationWindow({
      window: win
    });

    var detailWindow = Titanium.UI.createWindow();

    var videoPlayer = Titanium.Media.createVideoPlayer({
      url: 'https://www.w3schools.com/html/mov_bbb.mp4',
      top: 2,
      autoplay: true,
      backgroundColor: 'blue',
      height: 300,
      width: 300,
      mediaControlStyle: Titanium.Media.VIDEO_CONTROL_DEFAULT,
      scalingMode: Titanium.Media.VIDEO_SCALING_ASPECT_FIT
    });

    // When the first window openes, open the next one
    win.addEventListener('open', function() {
			this.timeout(500);
      nav.openWindow(detailWindow);
    });

    // Once the next window opens, close it again
    detailWindow.addEventListener('open', function() {
			this.timeout(500);
      nav.closeWindow(detailWindow);
    });

    // If the detail window closes successfully without a crahs, we are good!
    detailWindow.addEventListener('close', function() {
      finish();
    });

    detailWindow.add(videoPlayer);
    nav.open();
  });
});

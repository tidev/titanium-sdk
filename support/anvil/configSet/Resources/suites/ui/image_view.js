/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

var isTizen = Ti.Platform.osname === 'tizen',
	isMobileWeb = Ti.Platform.osname === 'mobileweb';

(isTizen || isMobileWeb) && Ti.include('countPixels.js');

module.exports = new function() {
	var finish,
	   valueOf;

	this.init = function(testUtils) {
		finish = testUtils.finish;
		valueOf = testUtils.valueOf;
	}

	this.name = "image_view";
	this.tests = [
		{name: "basic"},
		{name: "image_as_string"},
		{name: "image_as_file"},
		{name: "image_as_blob"},
		{name: "add_remove"},
		{name: "animation", timeout: 20000}
	];
		
	var addImageToView = function(testRun, item){
		// Load image and verify it's loaded by checking the
		// screenshot. The image has 5000 green pixels and 4900 blue pixels.
		// The image can be: string (URL), Blob, or File.
		var cp,
			win = Ti.UI.createWindow({
				backgroundColor: '#FFFFFF'
			}),
			image = Ti.UI.createImageView({
				backgroundColor: '#000000',
				width: 100,
				height: 100
			});
		
		(isTizen || isMobileWeb) && (cp = new CountPixels());
		
		var onImageViewCompleteBluePx = function(count) {
			valueOf(testRun, count).shouldBeEqual(4900);
			win.close();
			finish(testRun);
		}

		var onImageViewCompleteGreenPx = function(count) {
			valueOf(testRun, count).shouldBeEqual(5000);
			cp.countPixels([0, 0, 255], win, onImageViewCompleteBluePx);
		}
		
		valueOf(testRun, function(){
			 image.setImage(item);
		}).shouldNotThrowException();
		
		valueOf(testRun, image.image).shouldBeEqual(item);
		valueOf(testRun, image.getImage()).shouldBeEqual(item);
		
		win.addEventListener('postlayout', function() {
			if (isTizen || isMobileWeb) {
				cp.countPixels([0, 255, 0], win, onImageViewCompleteGreenPx);
			} else {
				win.close();
				finish(testRun);
			}
		});

		win.add(image);
		win.open();
	};
		
		
	this.basic = function(testRun) {
		var image,
			cp;
			// Verify the imageView really appears on the screen. On the screen 
			// should appear red pixels.
			win = Ti.UI.createWindow({
				backgroundColor: '#FFFFFF'
			});
		
		(isTizen || isMobileWeb) && (cp = new CountPixels());

		var onStartTest = function(count) {
			valueOf(testRun, count).shouldBeEqual(0);
		}

		var onImageViewComplete = function(count) {
			valueOf(testRun, count).shouldBeGreaterThan(0);
			win.close();
			finish(testRun);
		} 

		valueOf(testRun, function() {
			image = Ti.UI.createImageView({
			  backgroundColor: '#FF0000',
			  width: 100,
			  height: 100
			});
		}).shouldNotThrowException();
		
		(isTizen || isMobileWeb) && (cp.countPixelsPercentage([255, 0, 0], win, onStartTest));
		
		win.addEventListener('postlayout', function() {
			if (isTizen || isMobileWeb) {
				cp.countPixelsPercentage([255, 0, 0], win, onImageViewComplete);
			} else {
				win.close();
				finish(testRun);
			}
		});

		win.add(image);
		win.open();
	}
		
	this.image_as_string = function(testRun) {
		// Verify in the imageView really apears the image (image as path)
		var imgString = 'file:///suites/ui/image_view/image.png'; 
		addImageToView(testRun, imgString);
	}
	
	
	this.image_as_file = function(testRun) {
		// Verify in the imageView really apears the image (image as file)
		var file = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, "suites/ui/image_view/image.png"); 
		addImageToView(testRun, file);
	}
	
	
	this.image_as_blob = function(testRun) {
		// Verify in the imageView really apears the image (image as blob)
		var file = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, "suites/ui/image_view/image.png"); 
		var blob = file.read();
		addImageToView(testRun, blob);
	}
		
		
	this.add_remove = function(testRun) {
		//ImageView can contains the child to this view's hierarchy.
		//We can add button for example and check if the button
		//really apears in the ImageView. We test it by verifying
		//that ImageView's pixels are really covered by the child view.
		var cp,
			win = Ti.UI.createWindow({
				backgroundColor: '#FFFFFF'
			});
			btn = Ti.UI.createButton({
				width: 50,
				height: 50,
				backgroundColor: '#FFFFFF'
			}),
			image = Ti.UI.createImageView({
				backgroundColor: '#FF0000',
				width: 100,
				height: 100
			});
		
		valueOf(testRun, function(){
			image.add(btn);
		}).shouldNotThrowException();
		
		(isTizen || isMobileWeb) && (cp = new CountPixels());
		
		var onIVcompleteAfterRemoving = function(count) {
			valueOf(testRun, count).shouldBeEqual(100);
			win.close();

			finish(testRun);
		}

		var onIVcomplete = function(count) {
			valueOf(testRun, count).shouldBeEqual(75);
			valueOf(testRun, function() {
				image.remove(btn);
			}).shouldNotThrowException();

			cp.countPixelsPercentage([255, 0, 0], image, onIVcompleteAfterRemoving);
		}

		win.addEventListener('postlayout', function() {
			if (isTizen || isMobileWeb) {
				cp.countPixelsPercentage([255, 0, 0], image, onIVcomplete);
			} else {
				win.close();
				finish(testRun);
			}
		});

		win.add(image);
		win.open();
	}
		
		
	this.animation = function(testRun) {
		/* ImageView can reproduces the animation of images what was added as
			array of images. One image contains blue and does not contains red pixels.
			Second image contains red and does not contains blue pixels.
			Check the presents of blue pixels, after one sec check the presents of red pixels */
		var cp;

		(isTizen || isMobileWeb) && (cp = new CountPixels());
		
		var images = ['file:///suites/ui/image_view/image.png', 'file:///suites/ui/image_view/image1.png'],
			win = Ti.UI.createWindow({
				backgroundColor: '#FFFFFF'
			}),
			flag;
			image = Ti.UI.createImageView({
				width: 100,
				height: 100
			});
		
		// Check default values
		valueOf(testRun, image.animating).shouldBeFalse();
		valueOf(testRun, image.duration).shouldBeEqual(200);
		valueOf(testRun, image.paused).shouldBeFalse();
		valueOf(testRun, image.repeatCount).shouldBeEqual(0);
		valueOf(testRun, image.reverse).shouldBeFalse();
		valueOf(testRun, image.images).shouldBeUndefined();
		valueOf(testRun, image.getAnimating()).shouldBeFalse();
		valueOf(testRun, image.getDuration()).shouldBeEqual(200);
		valueOf(testRun, image.getPaused()).shouldBeFalse();
		valueOf(testRun, image.getRepeatCount()).shouldBeEqual(0);
		valueOf(testRun, image.getReverse()).shouldBeFalse();
		valueOf(testRun, image.getImages()).shouldBeUndefined();
		
		valueOf(testRun, function() {
			image.setImages(images)
		}).shouldNotThrowException();
		
		valueOf(testRun, image.images).shouldBeArray();
		valueOf(testRun,image.getImages()).shouldBeArray();
		
		valueOf(testRun, function() {
			image.pause();
		}).shouldNotThrowException();
		valueOf(testRun, image.paused).shouldBeTrue();
		
		valueOf(testRun, function() {
			image.resume();
		}).shouldNotThrowException();
		valueOf(testRun, image.getPaused()).shouldBeFalse();
		
		valueOf(testRun, function() {
			image.setDuration(1000);
		}).shouldNotThrowException();
		valueOf(testRun, image.getDuration()).shouldBeEqual(1000);
		valueOf(testRun, image.duration).shouldBeEqual(1000);
		
		valueOf(testRun, function() {
			image.setRepeatCount(3);
		}).shouldNotThrowException();
		valueOf(testRun, image.repeatCount).shouldBeEqual(3);
		valueOf(testRun, image.getRepeatCount()).shouldBeEqual(3);
		
		var bluePixelsCB = function(count) {
			valueOf(testRun, count).shouldBeEqual(49);
		}

		var redPixelsCB = function(count) {
			valueOf(testRun, count).shouldBeEqual(50);
			win.close();
			finish(testRun);
		}
		
		if (isTizen || isMobileWeb) {
			image.addEventListener('stop', function() {
				if (!flag) {
					cp.countPixelsPercentage([0, 0, 255], image, bluePixelsCB);

					setTimeout(function() {
						cp.countPixelsPercentage([255, 0, 0], image, redPixelsCB);
					}, 1200);

					flag = true;

					valueOf(testRun, function() {
						image.start();
					}).shouldNotThrowException();
				}
			})
		} else {
			win.close();
			finish(testRun);
		}

		win.add(image);
		win.open();
	}
}
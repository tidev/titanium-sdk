/* Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details. */

Ti.include('countPixels.js');

module.exports = new function() {
	var finish,
		valueOf,
		reportError,
		wind, 
		cp,
		width = 320,
		height = 510;
		
	this.init = function(testUtils) {
		finish = testUtils.finish;
		valueOf = testUtils.valueOf;
		reportError = testUtils.reportError;
		cp = new CountPixels();
	}

	this.name = "animation";
	this.tests = [
		{name: "backgroundColor_test"},
		{name: "autoreverse_test"},
		{name: "bottom_test", timeout: 5000},
		{name: "top_test"},
		{name: "left_test"},
		{name: "right_test", timeout: 5000},
		{name: "color_test"},
		{name: "height_test"},
		{name: "width_test"},
		{name: "visible_test", timeout: 5000},
		{name: "zIndex_test", timeout: 5000},
		{name: "opacity_test"},
		{name: "delay_test"},
		{name: "duration_test"},
		{name: "transform_test"}
	];
	
	function animationHandler(e, colors, result, testRun, wind, countPercents) {
		if (countPercents) {
			cp.countPixelsPercentage(colors, wind, function(count) {
				valueOf(testRun, count).shouldBe(result);
				wind.close();
				finish(testRun);
			});
		} else {
			cp.countPixels(colors, wind, function(count) {
				valueOf(testRun, count).shouldBe(result);
				wind.close();
				finish(testRun);
			});
		}
	}

	this.backgroundColor_test = function(testRun) {
		var wind = Ti.UI.createWindow({
				backgroundColor: '#ffffff',
				width: width,
				height: height
			}),
			view = Titanium.UI.createView({
				backgroundColor: 'red'
			}),
			animation = Titanium.UI.createAnimation({
				backgroundColor: '#00ff00',
				duration: 4000
			});
			
		wind.add(view);
		
		animation.addEventListener('complete', function(e) {
			animationHandler(e, [0, 255, 0], 100, testRun, wind, true);
		});
		
		view.addEventListener('postlayout', function() {
			view.animate(animation);
		});

		wind.open();
	}

	this.autoreverse_test = function(testRun) {
		var wind = Ti.UI.createWindow({
				backgroundColor: '#ffffff',
				width: width,
				height: height
			}),
			view = Titanium.UI.createView({
				backgroundColor: '#ff0000'
			}),
			animation = Titanium.UI.createAnimation({
				backgroundColor: '#000000',
				duration: 2000,
				autoreverse: true
			});
			
		wind.add(view);

		animation.addEventListener('complete', function(e) {
			animationHandler(e, [255, 0, 0], 100, testRun, wind, true);
		});

		view.addEventListener('postlayout', function() {
			view.animate(animation);
		});

		wind.open();
	}	

	this.bottom_test = function(testRun) {
		var wind = Ti.UI.createWindow({
				backgroundColor: '#ffffff',
				width: width,
				height: height
			}),		
			view = Titanium.UI.createView({
				backgroundColor: '#ff0000',
				bottom: 10
			}),
			animation = Titanium.UI.createAnimation({
				bottom: 50,
				duration: 2000
			});
			
		wind.add(view);

		animation.addEventListener('complete', function(e) {
			animationHandler(e, [255, 0, 0], width * (height - 50), testRun, wind);
		});

		view.addEventListener('postlayout', function(e) {
			view.animate(animation);
		});

		wind.open();
	}	

	this.top_test = function(testRun) {
		var wind = Ti.UI.createWindow({
				backgroundColor: '#ffffff',
				width: width,
				height: height
			}),			
			view = Titanium.UI.createView({
				backgroundColor:'#ff0000',
				top : 10
			}),
			animation = Titanium.UI.createAnimation({
				top: 50,
				duration: 2000
			});
			
		wind.add(view);
			
		animation.addEventListener('complete', function(e) {
			animationHandler(e, [255, 0, 0], width * (height - 50), testRun, wind);
		});

		view.addEventListener('postlayout', function(e) {
			view.animate(animation);
		});

		wind.open();
	}

	this.left_test = function(testRun) {
		var wind = Ti.UI.createWindow({
				backgroundColor: '#ffffff',
				width: width,
				height: height
			}),			
			view = Titanium.UI.createView({
				backgroundColor: '#ff0000',
				left : 10
			}),
			animation = Titanium.UI.createAnimation({
				left: 50,
				duration: 2000
			});

		wind.add(view);

		animation.addEventListener('complete', function(e) {
			console.log('complete');
			animationHandler(e, [255, 0, 0], (width - 50) * height, testRun, wind);
		});

		view.addEventListener('postlayout', function(e) {
			view.animate(animation);
		});

		wind.open();
	}

	this.right_test = function(testRun) {
		var wind = Ti.UI.createWindow({
				backgroundColor: '#ffffff',
				width: width,
				height: height
			}),			
			view = Titanium.UI.createView({
				backgroundColor: '#ff0000',
				right: 10
			}),
			animation = Titanium.UI.createAnimation({
				right: 50,
				duration: 1000
			});

		wind.add(view);
			
		animation.addEventListener('complete', function(e) {
			animationHandler(e, [255, 0, 0], (width - 50) * height, testRun, wind);
		});

		view.addEventListener('postlayout', function(e) {
			view.animate(animation);
		});

		wind.open();
	}

	this.color_test = function(testRun) {
		var wind = Ti.UI.createWindow({
				backgroundColor: '#ffffff',
				width: width,
				height: height
			}),
			label = Ti.UI.createLabel({
				text: 'This is a label',
				color: '#000000'
			}),
			animation = Titanium.UI.createAnimation({
				color: '#ffffff',
				delay: 3000
			});
			
		wind.add(label);
			
		animation.addEventListener('complete', function(e) {
			animationHandler(e, [0, 0, 0], 100, testRun, wind, true);
		});

		wind.addEventListener('postlayout', function(e) {
			label.animate(animation);
		});

		wind.open();
	}

	this.height_test = function(testRun) {
		var wind = Ti.UI.createWindow({
				backgroundColor: '#ffffff',
				width: width,
				height: height
			}),			
			view = Titanium.UI.createView({
				backgroundColor: '#ff0000',
				height : height
			}),
			animation = Titanium.UI.createAnimation({
				height: height - 50,
				duration: 2000
			});
			
		wind.add(view);
			
		animation.addEventListener('complete', function(e) {
			animationHandler(e, [255, 0, 0], width * (height - 50), testRun, wind);
		});

		view.addEventListener('postlayout', function(e) {
			view.animate(animation);
		});

		wind.open();
	}	

	this.width_test = function(testRun) {
		var wind = Ti.UI.createWindow({
				backgroundColor: '#ffffff',
				width: width,
				height: height
			}),			
			view = Titanium.UI.createView({
				backgroundColor: '#ff0000',
				width : width
			}),
			animation = Titanium.UI.createAnimation({
				width: width - 50,
				duration: 1000
			});
			
		wind.add(view);
			
		animation.addEventListener('complete', function(e) {
			animationHandler(e, [255, 0, 0], (width - 50) * height, testRun, wind);
		});

		view.addEventListener('postlayout', function(e) {
			view.animate(animation);
		});

		wind.open();
	}

	this.visible_test = function(testRun) {
		var wind = Ti.UI.createWindow({
				backgroundColor: '#ffffff',
				width: width,
				height: height
			}),			
			view = Titanium.UI.createView({
				backgroundColor: '#ff0000',
			}),
			animation = Titanium.UI.createAnimation({
				visible: false,
				delay: 3000
			});
			
		wind.add(view);
			
		animation.addEventListener('complete', function(e) {
			animationHandler(e, [255, 0, 0], 0, testRun, wind);
		});

		view.addEventListener('postlayout', function(e) {
			view.animate(animation);
		});

		wind.open();
	}

	this.zIndex_test = function(testRun) {
		var wind = Ti.UI.createWindow({
				backgroundColor: '#ffffff',
				width: width,
				height: height
			}),			
			view = Titanium.UI.createView({
				backgroundColor: '#ff0000',
				zIndex: 999999
			}),
			animation = Titanium.UI.createAnimation({
				zIndex: 1,
				duration: 2000
			});
		
		wind.zIndex = 1000;		
		wind.add(view);
			
		animation.addEventListener('complete', function(e) {
			animationHandler(e, [255, 255, 255], width * height, testRun, wind);
		});

		view.addEventListener('postlayout', function(e) {
			view.animate(animation);
		});

		wind.open();
	}

	this.opacity_test = function(testRun) {
		var wind = Ti.UI.createWindow({
				backgroundColor: '#000000',
				width: width,
				height: height
			}),			
			view = Ti.UI.createView({
				width: width,
				height: height,
				backgroundColor: '#ff0000'
			}),
			animation = Ti.UI.createAnimation({
				opacity: 0.5
			});
		
		wind.add(view);

		animation.addEventListener('complete', function(e) {
			animationHandler(e, [127, 0, 0], width * height, testRun, wind);
		});
		
		wind.addEventListener('postlayout', function(e) {
			view.animate(animation);
		});
		
		wind.open();
	}

	this.delay_test = function(testRun) {
		var wind = Ti.UI.createWindow({
				backgroundColor: '#ffffff',
				width: width,
				height: height
			}),			
			view = Titanium.UI.createView({
				backgroundColor: '#ff0000',
				width: width,
				height: height
			}),
			animation = Titanium.UI.createAnimation({
				delay: 3000,
				backgroundColor: "#00ff00",
				duration: 1000
			});
			
		wind.add(view);

		setTimeout(function() {
			cp.countPixels([255, 0, 0], 
				wind, 
				function(count) {
					valueOf(testRun, count).shouldBe(width * height);
				}
			);			
		}, 1000);
			
		animation.addEventListener('complete', function(e) {
			animationHandler(e, [0, 255, 0], width * height, testRun, wind);
		});

		view.addEventListener('postlayout', function(e) {
			view.animate(animation);
		});

		wind.open();
	}

	this.duration_test = function(testRun) {
		var wind = Ti.UI.createWindow({
				backgroundColor: '#ffffff',
				width: width,
				height: height
			}),			
			view = Titanium.UI.createView({
				backgroundColor:'#ff0000',
				width: width,
				height: height
			}),
			animation = Titanium.UI.createAnimation({
				backgroundColor: "#00ff00",
				duration: 4000
			});
			
		wind.add(view);
		
		setTimeout(function() {
			cp.countPixels([255, 0, 0], 
				wind, 
				function(count) {
					valueOf(testRun, count).shouldBe(0);
				}
			);			
		}, 1000);
			
		animation.addEventListener('complete', function(e) {
			animationHandler(e, [0, 255, 0], width * height, testRun, wind);
		});

		view.addEventListener('postlayout', function(e) {
			view.animate(animation);
		});

		wind.open();
	}

	this.transform_test = function(testRun) {
		var wind = Ti.UI.createWindow({
				backgroundColor: '#ffffff',
				width: width,
				height: height
			}),			
			view = Titanium.UI.createView({
				backgroundColor: '#ff0000',
				width: 40,
				height: 40
			}),
			matrix = Ti.UI.create2DMatrix(),
			animation = Titanium.UI.createAnimation({
				backgroundColor: "#00ff00",
				duration: 4000,
				repeat: 2
			});
		
		matrix = matrix.scale(2, 2);		
		animation.transform = matrix;
			
		wind.add(view);

		animation.addEventListener('complete', function(e) {
			animationHandler(e, [0, 255, 0], 40 * 40 * 4, testRun, wind);
		});

		view.addEventListener('postlayout', function(e) {
			view.animate(animation);
		});

		wind.open();
	}
}
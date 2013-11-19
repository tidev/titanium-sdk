module.exports = new function() {
	var finish;
	var valueOf;
	this.init = function(testUtils) {
		finish = testUtils.finish;
		valueOf = testUtils.valueOf;
	}

	this.name = "ui_imageview";
	this.tests = [
			{name: "TiNinePatchImage", timeout: 5000},
			{name: "loadEvent", timeout: 10000},
			{name: "loadEventForImageState", timeout: 30000}
	];

	//12961
	this.TiNinePatchImage = function(testRun){
		var win = Ti.UI.createWindow();
		var view = Ti.UI.createView({
			height: 100,
			width: 100,
			backgroundImage: '/suites/ui_imageview/image.png'
		});
		view.addEventListener('postlayout', function(){
			valueOf(testRun, view.getHeight()).shouldBe(100);
			valueOf(testRun, view.getHeight()).shouldBe(100);

			finish(testRun);
		});
		win.add(view);
		win.open();
	}

	//TIMOB-1333
	this.loadEvent = function(testRun){
		var win1 = Titanium.UI.createWindow();
		var image = Titanium.UI.createImageView({                   
			width: 'auto',
			height: 'auto',                 
			image: '/suites/ui_imageview/image.png'
		});
		image.addEventListener('load', function(){
			finish(testRun);
		});
		win1.add(image);
		win1.open();
	}

	//TIMOB-7317
	this.loadEventForImageState = function(testRun){
		var win = Titanium.UI.createWindow();
		var imgView = Ti.UI.createImageView({
			touchEnabled: false,
			left: 0,
			top: 0,
			width: 100,
			image: '/suites/ui_imageview/image.png',
			height: 100
		});
		imgView.addEventListener('load', function(){
			valueOf(testRun, imgView.touchEnabled).shouldBeFalse();

			finish(testRun);
		});
		imgView.image = 'http://codedog.net/wp-content/uploads/2011/09/appcelerator.png';
		win.add(imgView);
		win.open();
	}
}
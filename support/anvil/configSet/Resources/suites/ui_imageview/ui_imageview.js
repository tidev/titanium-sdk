module.exports = new function() {
	var finish;
	var valueOf;
	this.init = function(testUtils) {
		finish = testUtils.finish;
		valueOf = testUtils.valueOf;
	}

	this.name = "ui_imageview";
	this.tests = [
			{name: "loadEvent", timeout: 10000},
			{name: "loadEventForImageState", timeout: 600000}
	];

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
		imgView.addEventListener('load', function(e){
			valueOf(testRun, e.state).shouldBe('image');

			finish(testRun);
		});
		imgView.image = 'http://codedog.net/wp-content/uploads/2011/09/appcelerator.png';
		win.add(imgView);
		win.open();
	}
}
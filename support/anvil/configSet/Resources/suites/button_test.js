module.exports = new function() {
	var finish;
	var valueOf;
	this.init = function(testUtils) {
		finish = testUtils.finish;
		valueOf = testUtils.valueOf;
	}
	
	this.name = "button_test";
	this.tests = [
		{name: "applyProperties", timeout: 5000}
	];

	//TIMOB-10344
	this.applyProperties = function(testRun){
		var win = Titanium.UI.createWindow();
		var btn = Ti.UI.createButton({
			width: 100,
			height: 40,
			title: 'title'
		});
		valueOf(testRun, btn.title).shouldBe('title');
		win.addEventListener('focus', function(){
			btn.applyProperties({
				width: 200,
				height: 100,
				title: 'changed'
			});
			valueOf(testRun, btn.getWidth()).shouldBe(200);
			valueOf(testRun, btn.getHeight()).shouldBe(100);
			valueOf(testRun, btn.title).shouldBe('changed');

			finish(testRun);
		});
		win.open();
	}
}
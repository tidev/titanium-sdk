module.exports = new function() {
	var finish;
	var valueOf;
	this.init = function(testUtils) {
		finish = testUtils.finish;
		valueOf = testUtils.valueOf;
	}
	
	this.name = "ui_optionDialog";
	this.tests = [
		{name: "dialogBox", timeout: 5000}
	];

	//TIMOB-7548
	this.dialogBox = function(testRun){
		var win = Ti.UI.createWindow();
		var dialog = Titanium.UI.createOptionDialog({
			options: ['Option 1','Option 2'],
			cancel: 1
		});
		var dialogShow = 0; 
		var view = Ti.UI.createView({
			backgroundColor:'red',
			height: 100,
			width: 100
		});
		win.addEventListener('focus', function(){
			for (var i=0;i<2;i++){
				dialogShow += 1; 
				dialog.show();
			}
			if(dialogShow == 2){
				win.add(view);
			}
		});
		view.addEventListener('postlayout', function(){
			valueOf(testRun, view.getHeight()).shouldBe(100);
			valueOf(testRun, view.getHeight()).shouldBe(100);
			valueOf(testRun, dialogShow).shouldBe(2);

			finish(testRun);
		});
		win.open();
	}
}
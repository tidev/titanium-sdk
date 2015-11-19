function getData(thetitle){
    var data = [];

    for(i=0;i<10;i++) {
    	data.push({properties: {title:thetitle}})
    }
    return data;
}

function list_setitems(_args) {
	var win = Ti.UI.createWindow({
		title:'Set Items'
	});
	
	var platformName = Titanium.Platform.osname;
	var isIOS = (platformName == 'iphone' || platformName == 'ipad');
	
	
	if (isIOS) {
		win.layout = 'vertical'
		var button = Ti.UI.createButton({
			title:'START TEST'
		})
		
		var section = Ti.UI.createListSection();
   		var listView = Ti.UI.createListView({
   			top:10,
   			sections: [ section ]
   		})
	
		win.add(button);
		win.add(listView);
		
		var animationStyles = {
			'None': Ti.UI.iPhone.RowAnimationStyle.NONE,
			'Left': Ti.UI.iPhone.RowAnimationStyle.LEFT,
			'Right': Ti.UI.iPhone.RowAnimationStyle.RIGHT,
			'Top': Ti.UI.iPhone.RowAnimationStyle.TOP,
			'Bottom': Ti.UI.iPhone.RowAnimationStyle.BOTTOM,
			'Fade': Ti.UI.iPhone.RowAnimationStyle.FADE,
		};
		var animationsArray = ['None', 'Left', 'Right', 'Top', 'Bottom', 'Fade'];
		
		var interval = null;
		var i = 0;
		button.addEventListener('click',function(){
			button.enabled = false;
			interval = setInterval(function() {
				var type = animationsArray[i];
				section.setItems(getData('Animation Style '+type), { animationStyle: animationStyles[type] });
				i = (i + 1) % animationsArray.length;
			}, 1000);
		})
		
		win.addEventListener('close',function(){
			if(interval !== null){
				clearInterval(interval);
			}
		})
	}
	else {
		var label = Ti.UI.createLabel({
			text: 'This is am iOS only test.\n If you got this far setItems() works on android'
		})
		win.add(label);
	}	
	return win;
};


module.exports = list_setitems;
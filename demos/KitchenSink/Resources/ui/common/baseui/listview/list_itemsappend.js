function getData(thetitle){
    var data = [{properties: {title:'Item - Animation '+thetitle}}];

    return data;
}
function getDataAndroid(){
    var data = [];

    for(i=0;i<2;i++) {
    	data.push({properties: {title:'Appended '+i}})
    }
    return data;
}

function list_appenditems(_args) {
	var win = Ti.UI.createWindow({
		title:'Append Items'
	});
	
	var platformName = Titanium.Platform.osname;
	var isIOS = (platformName == 'iphone' || platformName == 'ipad');
	
	
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
			if (isIOS) {
				var type = animationsArray[i];
				section.appendItems(getData(type), { animationStyle: animationStyles[type] });
				i = (i + 1) % animationsArray.length;
			} else {
				section.appendItems(getDataAndroid());
			}
		}, 1000);
	})
	
	win.addEventListener('close',function(){
		if(interval !== null){
			clearInterval(interval);
		}
	})
	
	return win;
};


module.exports = list_appenditems;
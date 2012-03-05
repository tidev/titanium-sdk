var win = Ti.UI.currentWindow;
win.backgroundColor = '#eee';

var actInd = Ti.UI.createActivityIndicator({
	message: 'Activity Indicator',
	font:{fontStyle:'italic'},
	color:'red',
	width: 200,
	height: 30,
	top: 10,
	left: 50,
	style:Ti.UI.iPhone.ActivityIndicatorStyle.PLAIN
});

var basicButton = Ti.UI.createButton({
	title:'Show activity indicator',
	top: 100,
	left: 10,
	width: 300,
	height: 40,
	font:{fontSize:18}
});

var advancedButton = Ti.UI.createButton({
	title: 'Change indicator',
	top: 150,
	left: 10,
	width: 300,
	height: 40,
	font:{fontSize:18}
});

var closeButton = Ti.UI.createButton({
	title:'Close Window',
	height:40,
	width:300,
	left:10,
	top:200,
	font:{fontSize:18}
});

closeButton.addEventListener('click', function(){
	win.close();
});

basicButton.addEventListener('click', function(){
    actInd.visible = !actInd.visible;
    basicButton.title = actInd.visible ? 'Hide activity indicator' : 'Show activity indicator';
});
var state=0;
advancedButton.addEventListener('click',function(){
	
	switch (state)
	{
		case 0:{
			actInd.style = Ti.UI.iPhone.ActivityIndicatorStyle.BIG;
			actInd.message = 'BIG activity indicator';
			state++;
			break;
		}
		case 1:{
			actInd.style = Ti.UI.iPhone.ActivityIndicatorStyle.DARK;
			actInd.message = 'DARK activity indicator';
			state++;
			break;
		}
		case 2:{
			actInd.style = Ti.UI.iPhone.ActivityIndicatorStyle.PLAIN;
			actInd.message = 'PLAIN activity indicator';
			state = 0;
			break;
		}
		
	}
	
	
	
});


win.add(closeButton);
win.add(actInd);
win.add(basicButton);
win.add(advancedButton);

var win = Ti.UI.currentWindow;
win.backgroundColor = '#eee';

var label1 = Ti.UI.createLabel({
	text: 'Click me!',
	width: 200,
	height: 40,
	left: 60,
	top: 10,
	fontSize:30,
	backgroundColor:'green',
	color: 'white',
	textAlign: 'center'
});

win.add(label1);
var check = true
label1.addEventListener('click',function(){
	if (check){
	label1.animate({backgroundColor:'red', top:100,borderRadius: 20, duration:1000});
	check = false;
	}
	else{
	label1.animate({backgroundColor:'green', top:10, borderRadius: 0, duration:1000});	
	check = true;
	}
});

var closeButton = Ti.UI.createButton({
	title:'Close Window',
	height:40,
	width:300,
	left:10,
	top:210,
	font:{fontSize:20}
});
win.add(closeButton);

closeButton.addEventListener('click', function(){
	win.close();
});




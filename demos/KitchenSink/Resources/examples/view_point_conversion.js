var win = Titanium.UI.currentWindow;
win.backgroundColor = 'blue';
win.name = "window";

var redView = Ti.UI.createView({
	borderColor:'black',
	borderWidth:6,
	borderRadius:2,
	backgroundColor:'red',
	width:200,
	height:50,
	top:0,
	name:"view 1"
});

var greenView = Ti.UI.createView({
	borderColor:'black',
	borderWidth:6,
	borderRadius:2,
	backgroundColor:'green',
	width:200,
	height:50,
	top:50,
	name:"view 1"
});

var yellowView = Ti.UI.createView({
	borderColor:'black',
	borderWidth:6,
	borderRadius:2,
	backgroundColor:'yellow',
	width:200,
	height:50,
	top:100,
	name:"view 1"
});

var magentaView = Ti.UI.createView({
	borderColor:'black',
	borderWidth:6,
	borderRadius:2,
	backgroundColor:'magenta',
	width:200,
	height:50,
	top:150,
	name:"view 1"
});

var purpleView = Ti.UI.createView({
	borderColor:'black',
	borderWidth:6,
	borderRadius:2,
	backgroundColor:'purple',
	width:200,
	height:50,
	top:200,
	name:"view 1"
});

var label1 = Ti.UI.createLabel({
	color:'white',
	font:{fontSize:14,fontFamily:'Helvetica Neue'},
	bottom:25,
	textAlign:'center',
	text:'',
	height:'auto',
	width:'auto'
});

var label2 = Ti.UI.createLabel({
	color:'white',
	font:{fontSize:14,fontWeight:'bold',fontFamily:'Helvetica Neue'},
	bottom:5,
	textAlign:'center',
	text:'click anywhere',
	height:'auto',
	width:'auto'
});

win.add(greenView);
win.add(yellowView);
win.add(magentaView);
win.add(purpleView);
win.add(label1);
win.add(label2);

greenView.addEventListener('click',function(ev)
{
	var localPoint = {x:ev.x, y:ev.y}
	var convPoint = yellowView.convertPointToView(localPoint, win);
	label1.text = "localPoint: " + localPoint.x + " " + localPoint.y;
	label2.text = "convPoint: " + convPoint.x + " " + convPoint.y;
});

yellowView.addEventListener('click',function(ev)
{
	try {
		var localPoint = {x:ev.x, y:ev.y}
		var convPoint = yellowView.convertPointToView(localPoint, redView);
		if (convPoint) {
			label1.text = "localPoint: " + localPoint.x + " " + localPoint.y;
			label2.text = "convPoint: " + convPoint.x + " " + convPoint.y;
		} else {
			throw "null object correctly returned";
		}
	} catch (e) {
		label1.text = "" + e;
		label2.text = "";
	}
}); 

magentaView.addEventListener('click',function(ev)
{
	if (Ti.Platform.model == "iPhone Simulator") {
		// Until the iOS simulator exception issue is resolved
		// this needs to be conditional
		Ti.API.debug("Skipping exception test in simulator");
		return;
	}

	try {
		var localPoint = {y:ev.y}
		var convPoint = magentaView.convertPointToView(localPoint, win);
	} catch (e) {
		label1.text = "exception correctly thrown";
		label2.text = "" + String(e).substring(0, 30) + "...";
	}
}); 

purpleView.addEventListener('click',function(ev)
{
	Ti.API.debug("purple view");
	try {
		var localPoint = {x:ev.x, y:ev.y}
		var convPoint = purpleView.convertPointToView(localPoint, win);
		if (convPoint) {
			label1.text = "localPoint: " + localPoint.x + " " + localPoint.y;
			label2.text = "convPoint: " + convPoint.x + " " + convPoint.y;
		} else {
			throw "null object correctly returned";
		}
	} catch (e) {
		label1.text = "" + e;
		label2.text = "";
	}
}); 


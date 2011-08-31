var win = Titanium.UI.currentWindow;
win.backgroundColor = 'blue';
win.name = "window";

var greenView = Ti.UI.createView({
	borderColor:'black',
	borderWidth:6,
	borderRadius:2,
	backgroundColor:'green',
	width:200,
	height:100,
	top:40,
	name:"view 1"
});

var yellowView = Ti.UI.createView({
	borderColor:'black',
	borderWidth:6,
	borderRadius:2,
	backgroundColor:'yellow',
	width:200,
	height:100,
	top:140,
	name:"view 1"
});

var redView = Ti.UI.createView({
	borderColor:'black',
	borderWidth:6,
	borderRadius:2,
	backgroundColor:'red',
	width:200,
	height:100,
	top:240,
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


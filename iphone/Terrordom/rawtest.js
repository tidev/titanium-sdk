// anchor_stretch.js

// test case showing anchorPoint having no effect on animating width
// Kosso


var win = Titanium.UI.currentWindow;

var label = Titanium.UI.createLabel({
	text:'Click the rectangle to animate its width to 50 pixels over 1 second.\n\nShould be anchorPoint top-left\n set using:\nanchorPoint:{x:0,y:0}',
	top:20,
	width:290,
	color:'#999',
	textAlign:'center'
});

win.add(label);


// create a rectangular view with anchorPoint top-left
var rectangle = Titanium.UI.createView({
	height:50,
	width:300,
	borderWidth:1,
	borderColor:'#444',
	backgroundColor:'#FF0',
	top:200,
//	center:{x:0,y:0},
	anchorPoint:{x:0,y:0}
});

win.add(rectangle);


// on click animate width to 50 over 1 second
rectangle.addEventListener('click', function(){
	rectangle.animate({width:50, duration:1000});	
});
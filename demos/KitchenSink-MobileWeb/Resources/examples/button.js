var win = Ti.UI.currentWindow;
win.backgroundColor = '#EEE';

var b1 = Ti.UI.createButton({
	title:'I am a Button',
	backgroundColor: 'red',
	height:40,
	width:200,
	top:10,
	left:60,
	opacity:0.5,
	borderRadius:10,
	borderWidth: 3,
	fontSize: 15
});

b1.fontSize = 15;

var b2 = Ti.UI.createButton({
	title:'Disabled',
	backgroundColor: '#0000FF',
	image:'/images/chat.png',
	width:200,
	height:40,
	top:60,
	left: 60,
	fontFamily: 'Arial',
	enabled: false,
	backgroundGradient:{
		type:'linear',
		colors:['#00f','#fff'],
		startPoint:{x:'left',y:'top'},
		endPoint:{x:'left',y:'bottom'},
		backFillStart:true
	}
});

b2.font = {fontSize:25, fontFamily:'Marker Felt', fontWeight:'bold'};

b2.addEventListener('click', function(){
	b1.remove();
}); 


var b3 = Ti.UI.createButton({
	color:'#000',
	backgroundImage:'/images/BUTT_grn_off.png',
	backgroundSelectedImage:'/images/BUTT_grn_on.png',
	top:110,
	left: 10,
	width:301,
	height:57,
	font:{fontSize:20,fontWeight:'bold',fontFamily:'Helvetica Neue'},
	title:'Click Me',
	borderWidth: 0
});

var buttonLabel = Ti.UI.createLabel({
	color:'#f00',
	highlightedColor:'#0f0',
	backgroundColor:'transparent',
	width:'100',
	height:'auto',
	right:25,
	bottom: 0,
	text: 'Custom \r\n Label'
});

b3.addEventListener('click', function(){
	b3.add(buttonLabel);
})
var b4 = Ti.UI.createButton({
	title: 'Click to Hide/Show button',
	top: 175, 
	left: 58,
	width: 204, 
	height: 57
});


b4.addEventListener('click', function(){
	if (b3.visible == true){
		b3.visible = false;
		
	}
	else{ b3.visible = true;
	}
})  


var desktopButton = Ti.UI.createButton({
	title: 'desktop Button',
	top: 235,
	left: 28,
	height: 45,
	touchEnabled: false,
	width: 130,
})

var mobileButton = Ti.UI.createButton({
	title: 'mobile Button',
	top: 235,
	left: 162,
	height: 45,
	width: 130,

})


var closeButton = Ti.UI.createButton({
	title:'Close Window',
	height:40,
	left: 58,
	width:204,
	top:285,
	font:{fontSize:20}
});



win.add(b1);
win.add(b2);
win.add(b3);
win.add(b4);
win.add(desktopButton);
win.add(mobileButton);
win.add(closeButton);

closeButton.addEventListener('click', function()
{
	Ti.UI.currentWindow.close();
});

if (Ti.Platform.osname == 'Windows' || Ti.Platform.osname == 'Mac' || Ti.Platform.osname == 'Linux'){
	mobileButton.enabled = false;
	desktopButton.addEventListener('click', function(){
		alert('This is Desktop');
	});
} else {
	desktopButton.enabled = false;
	mobileButton.addEventListener('click',function(){
		alert('This is Mobile device')
	});
}

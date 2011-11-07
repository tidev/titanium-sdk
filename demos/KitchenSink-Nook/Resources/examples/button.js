var win = Titanium.UI.currentWindow;

var b1 = Titanium.UI.createButton({
	title:'I am a Button',
	height:40,
	width:200,
	top:10
});

var b3 = Titanium.UI.createButton({
	color:'#fff',
	backgroundImage:'../images/BUTT_grn_off.png',
	backgroundSelectedImage:'../images/BUTT_grn_on.png',
	backgroundDisabledImage: '../images/BUTT_drk_off.png',
	top:90,
	width:301,
	height:57,
	font:{fontSize:20,fontWeight:'bold',fontFamily:'Helvetica Neue'},
	title:'Click Me'
});

var buttonLabel = Titanium.UI.createLabel({
	color:'#f00',
	highlightedColor:'#0f0',
	backgroundColor:'transparent',
	width:'100',
	height:'auto',
	right:5,
	text:'Custom Label'
});

b3.add(buttonLabel);

var state = 0;
b3.addEventListener('click', function()
{
	switch (state)
	{
		case 0:
			b3.enabled=false;
			b3.title = 'I am Disabled';
			state++;

			setTimeout(function()
			{
				b3.enabled=true;
				b3.title = 'I am Enabled';
			},1000);

			break;
		case 1:
			b3.font = {fontSize:25,fontFamily:'Marker Felt', fontWeight:'bold'};
			b3.title = 'I am red';
			b3.backgroundImage = '../images/BUTT_red_off.png';
			b3.backgroundSelectedImage = '../images/BUTT_red_on.png';
			b3.color = '#222';
			state++;
			break;
		case 2:
			b3.width = 200;
			b3.color = '#fff';
			b3.title = 'White text';
			state=0;
			break;
	}
});

var b4 = Titanium.UI.createButton({
	title:'Hide/Show Button Above',
	width:250,
	height:40,
	top:175
});

var visible = true;
b4.addEventListener('click', function()
{
	if (!visible)
	{
		b3.show();
		visible=true;
	}
	else
	{
		b3.hide();
		visible=false;
	}
});

win.add(b1);
win.add(b3);
win.add(b4);

// add a series of alignment buttons
var buttonRows = [
	[
		{ title: 'H-Left', textAlign: Titanium.UI.TEXT_ALIGNMENT_LEFT },
		{ title: 'H-Center', textAlign: Titanium.UI.TEXT_ALIGNMENT_CENTER },
		{ title: 'H-Right', textAlign: Titanium.UI.TEXT_ALIGNMENT_RIGHT }
	],
	[
		{ title: 'V-Top', verticalAlign: Titanium.UI.TEXT_VERTICAL_ALIGNMENT_TOP },
		{ title: 'V-Center', verticalAlign: Titanium.UI.TEXT_VERTICAL_ALIGNMENT_CENTER },
		{ title: 'V-Bottom', verticalAlign: Titanium.UI.TEXT_VERTICAL_ALIGNMENT_BOTTOM }
	]
];
var container = Ti.UI.createView({
	top: 300,	
	width: 300,
	height: 90
});

for (var i = 0; i < buttonRows.length; i++) {
	var row = buttonRows[i];
	for (var j = 0; j < row.length; j++) {
		var button = Titanium.UI.createButton({
			title: row[j].title,
			width: 100,
			height: 40,
			top: 50 * i,
			left: 100 * j,
			textAlignProperty: row[j].textAlign,
			verticalAlignProperty: row[j].verticalAlign
		});
		button.addEventListener('click', function(e) {
			if (e.source.textAlignProperty) {
				b1.textAlign = e.source.textAlignProperty;
			} else if (e.source.verticalAlignProperty) {
				b1.verticalAlign = e.source.verticalAlignProperty;
			}
		});	
		container.add(button);
	}
}
win.add(container);
var win = Titanium.UI.currentWindow;

var b1 = Titanium.UI.createButton({
	title:'I am a Button',
	height:40,
	width:200,
	top:10
});


var b2 = Titanium.UI.createButton({
	title:'I am a Button',
	image:'../images/chat.png',
	width:200,
	height:40,
	top:60
});


var b3 = Titanium.UI.createButton({
	color:'#fff',
	backgroundImage:'../images/BUTT_grn_off.png',
	backgroundSelectedImage:'../images/BUTT_grn_on.png',
	backgroundDisabledImage: '../images/BUTT_drk_off.png',
	top:110,
	width:301,
	height:57,
	font:{fontSize:20,fontWeight:'bold',fontFamily:'Helvetica Neue'},
	title:'Click Me'
});


var state = 0;
b3.addEventListener('click', function()
{
	switch (state)
	{
		case 0:
		{
			b3.enabled=false;
			b3.title = 'I am Disabled';
			state++;
			
			setTimeout(function()
			{
				b3.enabled=true;
				b3.title = 'I am Enabled';
			},1000);
			
			break;
		}
		case 1:
		{
			b3.font = {fontSize:25,fontFamily:'Marker Felt', fontWeight:'bold'};
			b3.title = 'I am red';
			b3.backgroundImage = '../images/BUTT_red_off.png';
			b3.backgroundSelectedImage = '../images/BUTT_red_on.png';
			b3.color = '#222';
			state++;
			break;
		}
		case 2:
		{
			b3.width = 200;
			b3.color = '#fff';
			b3.title = 'White text';
			state=0;
			break;
		}

	}
});

var b4 = Titanium.UI.createButton({
	title:'Hide/Show Button Above',
	width:200,
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

// add iphone specific tests
if (Titanium.Platform.name == 'iPhone OS')
{
	win.add(b2);
}


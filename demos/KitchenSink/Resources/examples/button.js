var win = Titanium.UI.currentWindow;

var b1 = Titanium.UI.createButton({
	color:'#fff',
	backgroundImage:'../images/BUTT_drk_off.png',
	backgroundSelectedImage:'../images/BUTT_drk_on.png',
	backgroundDisabledImage: '../images/BUTT_gry_on.png',
	top:10,
	width:301,
	height:57,
	font:{fontSize:20,fontWeight:'bold',fontFamily:'Helvetica Neue'},
	title:'Click Me'
});

win.add(b1);
var one = false;

b1.addEventListener('click', function()
{
	if (!one)
	{
		b1.title = 'It worked';
		b1.color = '#111';
		b1.backgroundImage = '../images/BUTT_grn_on.png';
		one=true;
	}
	else
	{
		b1.title = 'Click Me';
		b1.color = '#fff';
		b1.backgroundImage = '../images/BUTT_drk_off.png';	
		one=false;
	}
});

var b2 = Titanium.UI.createButton({
	title:'Disable Button 1',
	height:40,
	width:200,
	top:80
});

win.add(b2);

b2.addEventListener('click', function()
{
	Ti.API.info('b1 enabled ' + b1.enabled)
	if (b1.enabled==true)
	{
		b1.enabled = false;
		b2.title = 'Enable Button 1';
	}
	else
	{
		b1.enabled = true;
		b2.title = 'Disable Button 1';
	}
});

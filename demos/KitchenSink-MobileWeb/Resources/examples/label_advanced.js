var win = Ti.UI.currentWindow;

var b1 = Ti.UI.createButton({
	title:'Click me',
	height:40,
	width:300,
	left: 10,
	top: 10,
	fontSize: 20
	});

win.add(b1);

var l1 = Ti.UI.createLabel({
	text:'I am a Label',
	textAlign: 'center',
	height:57,
	width:300,
	left: 10,
	top: 60,
	color: '#FFF',
	backgroundColor: '#080',
//	backgroundSelectedColor: '#008',	
	backgroundSelectedImage: '/images/BUTT_grn_off.png',
	fontSize: 20,
	fontStyle: 'italic',
	fontWeight: 'bold',
	fontFamily: 'Helvetica Neue',
	borderWidth: 3,
	borderRadius: 5,
	borderColor: "#800",
	zIndex:3,
	shadowColor:'#000',
	shadowOffset:{x:3,y:3}
	});

win.add(l1);

var l3 = Ti.UI.createLabel({
				text:'Click to hide label',
				textAlign: 'center',
				height:57,
				width:300,
				left: 10,
				top: 100,
				opacity: 0.5,
				zIndex: 4,
				backgroundColor: '#F00',
			});

var innerLabel = Ti.UI.createLabel({
			fontSize: 10,
			text:'Inner Label',
			height:20,
			width:70,
			right: 10,
			bottom: 5,	
			backgroundColor: 'red',
			Color: '#FFF'		
			});
			
var sizeChange = function(){
				l1.text = 'Size changed';
				l1.size = {width: 320, height: 40};
							
			};			
			

var state = 0;
b1.addEventListener('click', function()
{
	switch (state)
	{
		case 0:
		{
			l1.text = 'Background image';
			l1.backgroundImage = '/images/BUTT_grn_off.png';
			state ++;
			break;
		}
		case 1:
		{	
			state++;
			l1.text = 'Background gradient',
			l1.backgroundGradient = {
			type:'linear',
			colors:['#008','#080'],
			startPoint:{x:0,y:25},
			endPoint:{x:0,y:57}
		};
			break;
		}
		case 2:
		{
			l1.text = 'Background image padding';
			l1.backgroundImage = '/images/BUTT_grn_off.png';
			l1.backgroundPaddingLeft = 10,
			l1.backgroundPaddingTop = 20,
			state ++;
			break;
			
		}
		case 3:
		{	l1.backgroundColor = '#080',
			l1.text = 'Inner Label';
			l1.backgroundImage = '';
			l1.add(innerLabel); 
			state++;
			break;
			
		}
		case 4:
		{	l1.text = 'Opacity and zIndex';
			l1.remove(innerLabel);
			win.add(l3);
			hidefunc = function(){
							l3.hide();
							setTimeout(function()
							{
							l3.text = 'eventListener removed',	
							l3.show();
											
							},1500);	
							l3.removeEventListener('click', hidefunc);
						};
						
			l3.addEventListener('click', hidefunc);
						
			state++;
			break;
			
		}
		case 5:
		{	
			l1.text = 'Opacity and zIndex removed. Click me.';
			b1.title = 'Restart test';
			win.remove(l3);
			l1.addEventListener('click',sizeChange);
			state++;
			break;
			
		}
		case 6:
		{	l1.backgroundImage = '';
			b1.title = 'Click me';
			l1.size = {width: 300, height: 57};
			l1.text = 'I am a Label';
			l1.backgroundGradient = {};
			l1.backgroundColor = '#080';
			l1.backgroundPaddingLeft = 0;
			l1.backgroundPaddingTop = 0;
			l3.text = 'Click to hide label';
			l1.removeEventListener('click',sizeChange);
			state = 0;
			break;
			
		}

	}
});

var closeButton = Ti.UI.createButton({
	title:'Close Window',
	height:40,
	width:300,
	left:10,
	top:150,
	font:{fontSize:20}
});
win.add(closeButton);

closeButton.addEventListener('click', function(){
	win.close();
});
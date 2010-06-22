var win = Titanium.UI.currentWindow;

var circle = Titanium.UI.createView({
	height:100,
	width:100,
	borderRadius:50,
	backgroundColor:'#336699',
	top:10
});

win.add(circle);

var label = Titanium.UI.createLabel({
	text:'Click circle repeatedly to animate or drag the circle',
	bottom:100,
	color:'#555',
	font:{fontSize:12,fontFamily:'Helvetica Neue'},
	textAlign:'center',
	height:'auto',
	width:'auto'
});

win.add(label);

circle.addEventListener('touchmove', function(e) 
{ 
	Ti.API.debug('Our event tells us the center is ' + e.x + ', ' + e.y ); 
	var newX = e.x + circle.animatedCenter.x - circle.width/2; 
	var newY = e.y + circle.animatedCenter.y - circle.height/2; 
	circle.animate({center:{x:newX,y:newY}, duration:1}); });

var mode = 0;
circle.addEventListener('click', function()
{
	switch(mode)
	{
		case 0:
		{
			firstAnimation();
			mode++;
			break;
		}
		case 1:
		{
			secondAnimation();
			mode++
			break;
		}
		case 2:
		{
			thirdAnimation();
			mode++
			break;
		}
		case 3:
		{
			fourthAnimation();
			mode=0;
			break;
		}

	}
});

//
// ANIMATION FUNCTIONS
//

// opacity - use inline animation object
function firstAnimation()
{
	var t = Ti.UI.create2DMatrix();
	t.a = 1;
	t.b = 2;
	t.c = 3;
	t.d = 4;

	// pass inline animation objects and get callback when done
	circle.animate({opacity:0,transform:t,duration:500}, function()
	{
		var t = Ti.UI.create2DMatrix();

		circle.animate({opacity:1,transform:t,duration:500})
	});
};

// background color - use animation object
function secondAnimation()
{
	var a = Titanium.UI.createAnimation();
	a.backgroundColor = '#ff0000';
	a.duration = 1000;

	var b = Titanium.UI.createAnimation();
	b.backgroundColor = '#336699';
	b.duration = 1000;

	circle.animate(a);

	//
	// ANIMATIONS SUPPORT A START EVENT
	//
	a.addEventListener('start', function()
	{
		Ti.API.info('IN START');
		label.text = 'Animation started';

	})

	//
	// ANIMATIONS SUPPORT A COMPLETE EVENT
	//
	a.addEventListener('complete', function()
	{
		Ti.API.info('IN COMPLETE')
		label.text = 'Animation completed';
		circle.animate(b);

		setTimeout(function()
		{
			label.text = 'Click circle repeatedly to animate or drag window'
		},2000)
	});
};

// animate the top and right property
function thirdAnimation()
{
	circle.animate({top:200,right:30,duration:500}, function()
	{
		circle.animate({top:0,left:0, duration:500});
	});
};

// animate the center point object
function fourthAnimation()
{
	circle.animate({center:{x:100,y:100},curve:Ti.UI.ANIMATION_CURVE_EASE_IN_OUT,duration:1000}, function()
	{
		circle.animate({center:{x:0,y:200},duration:1000}, function()
		{
			circle.animate({center:{x:300,y:300},duration:1000},function()
			{
				circle.animate({center:{x:150,y:60, duration:1000}});
			});
		})
	});
};

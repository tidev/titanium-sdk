function win_nav(_args) {
	// current window
	var win = Titanium.UI.createWindow({
		title:_args.title
	});
	
	//
	// TOGGLE TITLE
	//
	var b1 = Titanium.UI.createButton({
		title:'Title',
		height:40,
		width:145,
		top:10,
		left:10
	});
	
	b1.addEventListener('click', function()
	{
		if (win.title != 'New Title')
		{
			win.title = 'New Title';
		}
		else
		{
			win.title = 'Window NavBar';
		}
	});
	
	win.add(b1);
	
	//
	// TOGGLE TITLE PROMPT
	//
	var b2 = Titanium.UI.createButton({
		title:'Title Prompt',
		height:40,
		width:145,
		top:10,
		right:10
	});
	
	b2.addEventListener('click', function()
	{
		if (win.titlePrompt != 'Title Prompt')
		{
			win.titlePrompt = 'Title Prompt';
		}
		else
		{
			win.titlePrompt = null;
		}
	});
	
	win.add(b2);
	
	//
	// TOGGLE TITLE IMAGE
	//
	var b3 = Titanium.UI.createButton({
		title:'Title Image',
		height:40,
		width:145,
		top:60,
		left:10
	});
	
	b3.addEventListener('click', function()
	{
		Titanium.API.info('title image ' + win.titleImage);
	
		if (win.titleImage == null)
		{
			win.titleControl = null;
			win.titleImage = '/images/slider_thumb.png';
		}
		else
		{
			win.titleImage = null;
		}
	});
	
	win.add(b3);
	
	//
	// TOGGLE TITLE CONTROL
	//
	var b4 = Titanium.UI.createButton({
		title:'Title Control',
		height:40,
		width:145,
		top:60,
		right:10
	});
	
	var control = false;
	b4.addEventListener('click', function()
	{
		if (!control)
		{
			var sw = Titanium.UI.createSwitch({value:false});
			win.titleControl = sw;
			control = true;
		}
		else
		{
			win.titleControl = null;
			control = false;
		}
	});
	
	win.add(b4);
	
	//
	// TOGGLE NAV BAR VISIBILITY
	//
	var b5 = Titanium.UI.createButton({
		title:'Hide/Show Nav',
		height:40,
		width:145,
		top:110,
		left:10
	});
	var hidden=false;
	b5.addEventListener('click', function()
	{
		if (!hidden)
		{
			win.hideNavBar();
			hidden = true;
		}
		else
		{
			win.showNavBar();
			hidden = false;
		}
	});
	win.add(b5);
	
	//
	// TOGGLE BAR COLOR
	//
	var b6 = Titanium.UI.createButton({
		title:'Bar Color',
		height:40,
		width:145,
		top:110,
		right:10
	});
	
	var barcolor=false;
	b6.addEventListener('click', function()
	{
		if (!barcolor)
		{
			win.barColor = '#336699';
			barcolor = true;
		}
		else
		{
			win.barColor = null;
			barcolor = false;
		}
	});
	
	win.add(b6);
	
	//
	// TOGGLE LEFT NAV BUTTON
	//
	var b7 = Titanium.UI.createButton({
		title:'Left Nav',
		height:40,
		width:145,
		top:160,
		left:10
	});
	
	var leftnav=false;
	b7.addEventListener('click', function()
	{
		if (!leftnav)
		{
			var b = Titanium.UI.createButton({title:'Left Nav'});
			win.leftNavButton = b;
			leftnav = true;
		}
		else
		{
			win.setLeftNavButton(null);
			leftnav = false;
		}
	});
	
	win.add(b7);
	
	//
	// TOGGLE RIGHT NAV BUTTON
	//
	var b8 = Titanium.UI.createButton({
		title:'Right Nav',
		height:40,
		width:145,
		top:160,
		right:10
	});
	
	var rightnav=false;
	b8.addEventListener('click', function()
	{
		if (!rightnav)
		{
			var b = Titanium.UI.createButton({title:'Right Nav'});
			win.rightNavButton = b;
			rightnav = true;
		}
		else
		{
			win.setRightNavButton(null);
			rightnav = false;
		}
	});
	
	win.add(b8);
	
	//
	// TOGGLE BACK BUTTON TITLE
	//
	var b9 = Titanium.UI.createButton({
		title:'Back Button Title',
		height:40,
		width:145,
		top:210,
		left:10
	});
	
	var backtitle=false;
	b9.addEventListener('click', function()
	{
		if (!backtitle)
		{
			win.backButtonTitleImage = null;	
			win.backButtonTitle = 'It Worked!';
			backtitle = true;
		}
		else
		{
			win.backButtonTitleImage = null;	
			win.backButtonTitle = 'Base UI';
			backtitle = false;
		}
	});
	
	win.add(b9);
	
	//
	// TOGGLE BACK BUTTON TITLE IMAGE
	//
	var b10 = Titanium.UI.createButton({
		title:'Back Button Image',
		height:40,
		width:145,
		top:210,
		right:10
	});
	
	var backtitleimage=false;
	b10.addEventListener('click', function()
	{
		if (!backtitleimage)
		{
			win.backButtonTitleImage = '/images/slider_thumb.png';		
			backtitleimage = true;
		}
		else
		{
			win.backButtonTitleImage = null;	
			backtitleimage = false;
		}
	});
	
	win.add(b10);
	
	var b11 = Titanium.UI.createButton({
		title:'Back button BG',
		height:40,
		width:145,
		top:260,
		left:10
	});
	
	var colored = false;
	b11.addEventListener('click', function()
	{
		if (!colored) {
			var backbutton = Titanium.UI.createButton({
				title:'BG nav', 
				backgroundImage:'/images/chat.png',
				width:100,
				height:20
			});
			backbutton.addEventListener('click', function() {
				win.close();
			});
			win.leftNavButton = backbutton;
			colored = true;
		}
		else {
			win.leftNavButton = null;
			colored = false;
		}
	});
	win.add(b11);
	
	//
	// BACKGROUND IMAGE ON NORMAL BUTTON
	//
	var b12 = Titanium.UI.createButton({
		title:'Button With Image',
		height:40,
		width:145,
		top:260,
		right:10
	});
	b12.addEventListener('click', function()
	{
		var b = Ti.UI.createButton({
			backgroundImage:'/images/camera.png',
			height:33,
			width:33
		});
		win.rightNavButton = b;
	});
	win.add(b12);
	
	var b13 = Titanium.UI.createButton({
		title:'Set Label',
		height:40,
		width:145,
		top:310,
		left:10
	});
	
	b13.addEventListener('click', function()
	{
		var l = Ti.UI.createLabel({
			text:'Hello',
			color:'#0f0',
			font:{fontSize:14}
		});
		win.rightNavButton = l;
	});
	win.add(b13);
	
	var b14 = Titanium.UI.createButton({
		title:'Set Bar Image',
		height:40,
		width:145,
		top:310,
		right:10
	});
	
	b14.addEventListener('click', function()
	{
		if(win.barImage)
		{
			win.barImage = null;
		}
		else
		{
			win.barImage = '/images/corkboard.jpg';
		}
	});
	win.add(b14);
	return win;
};

module.exports = win_nav;
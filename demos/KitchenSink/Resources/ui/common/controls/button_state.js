function button_states(_args) {
	var win = Ti.UI.createWindow({
		title:_args.title
	});
	
	var button1 = Titanium.UI.createButton({
	  left:10,
	  top:10,
	  height:50,
	  width:50,
	  enabled:true,
	  focusable:true,
	  title:'B1',
	  backgroundColor: 'white',
	  backgroundImage:'/images/slightlylargerimage.png'
	});
	
	var button2 = Titanium.UI.createButton({
	  left:70,
	  top:10,
	  height:50,
	  width:50,
	  focusable:true,
	  enabled:true,
	  title:'B2',
	  backgroundColor: 'white',
	  backgroundDisabledImage:'/images/slightlylargerimage.png'
	});
	
	var button3 = Titanium.UI.createButton({
	  left:130,
	  top:10,
	  height:50,
	  width:50,
	  enabled:true,
	  focusable:true,
	  title:'B3',
	  backgroundColor: 'white',
	  backgroundFocusedImage:'/images/slightlylargerimage.png'
	});
	
	var button4 = Titanium.UI.createButton({
	  left:190,
	  top:10,
	  height:50,
	  width:50,
	  focusable:true,
	  enabled:true,
	  title:'B4',
	  backgroundColor: 'white',
	  backgroundSelectedImage:'/images/slightlylargerimage.png'
	});
	
	var button5 = Titanium.UI.createButton({
	  left:10,
	  top:200,
	  height:60,
	  width:100,
	  focusable:true,
	  enabled:true,
	  title:'click me'
	});
	
	var state=1;
	button5.addEventListener('click',function()
	{
		switch(state)
		{
			case 0:
				button2.focusable=true;
				button2.enabled=true;
				state=1;
				break;
			case 1:
				button2.focusable=false;
				button2.enabled=false;
				state=0;
				break;
			
		}
	})
	
	
	win.add(button1);
	win.add(button2);
	win.add(button3);
	win.add(button4);
	win.add(button5);
	
	return win;
}

module.exports = button_states;
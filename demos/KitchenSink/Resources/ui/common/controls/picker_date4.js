function picker_date4(_args) {
	var win = Ti.UI.createWindow({
		title:_args.title
	});
	win.backgroundColor = 'black';
	
	var duration = 60000 * 3; // expressed in milliseconds
	var original_duration = duration;
			
	var picker = Ti.UI.createPicker({
		type:Ti.UI.PICKER_TYPE_COUNT_DOWN_TIMER,
		countDownDuration:duration
	});
	
	var timob1462fix = false;
	
	if (Titanium.Platform.name == 'iPhone OS')
	{
		timob1462fix = (Ti.version >= '3.0.0');
	}

	// turn on the selection indicator (off by default)
	picker.selectionIndicator = true;
	
	win.add(picker);
	
	var label = Ti.UI.createLabel({
		text:'Start (180 s Remaining)',
		top:6,
		textAlign:'center',
		color:'white'
	});
	win.add(label);
	
	var button = Ti.UI.createButton({
		title:'Start',
		top:34,
		width:120,
		height:30
	});
	win.add(button);
	
	var timer;
	
	function tick()
	{
		duration-=1000;
		picker.countDownDuration = duration;
		label.text = "  Run ("+(duration/1000)+" s Remaining)";
		if (duration<=0)
		{
			clearInterval(timer);
			button.title = 'Start';
			label.text = "Done!";
			duration = original_duration;
			picker.countDownDuration = duration;
		}
	}
	
	
	button.addEventListener('click',function(e)
	{
		if (button.title == 'Start')
		{
			button.title = 'Stop';
			timer = setInterval(tick,1000);
		}
		else
		{
			button.title = 'Start';
			clearInterval(timer);
			timer = null;
			label.text = " Stop ("+(duration/1000)+" s Remaining)";
		}
	});
	
	picker.addEventListener('change',function(e)
	{
		if (timob1462fix == true)
		{
			if (button.title == 'Start')
			{
				label.text = 'Start ('+e.countDownDuration/1000+' s Remaining)';
				duration = e.countDownDuration;
			}
		}
		else
		{
			label.text = e.value.toLocaleString();
		}
	});

	return win;
}

module.exports = picker_date4;
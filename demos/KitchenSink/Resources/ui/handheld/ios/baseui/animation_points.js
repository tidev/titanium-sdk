function anim_point(_args) {
	var win = Titanium.UI.createWindow({
		title:_args.title,
		layout:'vertical'
	});
	
	var c1 = Ti.UI.createView({height:Ti.UI.SIZE});
	var c2 = Ti.UI.createView({top:10});
	
	win.add(c1);
	win.add(c2);
	 
	var circle = Titanium.UI.createView({
	    height:100,
	    width:100,
	    borderRadius:50,
	    backgroundColor:'#336699',
	    top:0,
	    left:0
	});
	 
	var l = Ti.UI.createLabel({
		text:'N/A',
		bottom:10,
		height:20,
		color:'#999',
		textAlign:'center'
	});

	c2.add(circle);
	c2.add(l);
	var b1 = Ti.UI.createButton({
	    title:'Start',
	    height:30,
	    top:0,
	    left:0
	});
	 
	var b2 = Ti.UI.createButton({
	    title:'Stop',
	    height:30,
	    top:0,
	    right:0,
	    enabled:false
	});
	 
	c1.add(b1);
	c1.add(b2);
	 
	var startLeft = 0; 
	var startRunning = false;
	var stopRunning = false;
	var duration = 5000;
	b1.addEventListener('click',function(e){
	    b2.enabled = true;
	    b1.enabled = false;
	    startRunning = true;
	    duration = ((200 - startLeft)*5000.0)/200;
	    circle.animate({curve:Ti.UI.ANIMATION_CURVE_LINEAR,top:200,left:200,duration:duration},function(e){
	        Ti.API.info('START ANIMATION COMPLETED');
	        b1.enabled = true;
	        if (stopRunning == false) {
	            circle.applyProperties({left:0,top:0});
	            startLeft = 0;
	            b2.enabled = false;
	        };
	        startRunning = false;
	    });
	});
	
	b2.addEventListener('click', function()
	{
	    var ac = circle.animatedCenter;
	    var newLeft = ac.x - circle.width/2;
	    var newTop = ac.y - circle.height/2;
	    var ratio = (newLeft-startLeft)/(200-startLeft);
	    newDuration = (1-ratio)*duration;
	    startLeft = newLeft;
	    stopRunning = true; 
	    circle.animate({curve:Ti.UI.ANIMATION_CURVE_LINEAR,left:newLeft,top:newTop,duration:newDuration},function(e){
	        Ti.API.info('STOP ANIMATION CONCLUDED');
	        stopRunning = false;
	    });
	
	    b2.enabled = false;
	});
	
	var interval = null;

	win.addEventListener('open',function(){
		interval = setInterval(function()
		{
			var ac = circle.animatedCenter;
	    	
			l.text = 'center x: ' + parseFloat(ac.x).toFixed(2) + ' y: ' + parseFloat(ac.y).toFixed(2);
		},300);
	});
	win.addEventListener('close', function() {
		clearInterval(interval);
	});
	
	return win;
};

module.exports = anim_point;
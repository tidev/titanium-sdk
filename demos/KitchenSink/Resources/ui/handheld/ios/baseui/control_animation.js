function control_anim(_args) {
	var win = Titanium.UI.createWindow({
		title:_args.title
	});
	win.backgroundColor = '#336699';
	
	var button = Titanium.UI.createButton({
		title:'Animate Me', 
		width:300,
		height:40,
		top:10
	});
	
	win.add(button);
	
	button.addEventListener('click', function()
	{
		var t = Titanium.UI.create3DMatrix();
		t = t.rotate(200,0,1,1);
		t = t.scale(3);
		t = t.translate(20,50,170);
		t.m34 = 1.0/-2000;
		button.animate({transform:t, duration:1000, autoreverse:true});
	});

	return win;
};

module.exports = control_anim;
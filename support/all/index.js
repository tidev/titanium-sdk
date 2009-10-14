window.onload = function()
{
	document.getElementById('version').innerHTML = Titanium.version;
	document.getElementById('phone').innerHTML = Titanium.Platform.name + ' '+Titanium.Platform.version;
	document.getElementById('b').onclick = function() { Titanium.Media.vibrate(); };

	Titanium.Gesture.addEventListener('shake',function(){
		var alerty = Titanium.UI.createAlertDialog();
		alerty.setTitle("Not stirred!");
		alerty.show();
	},false);
	
};

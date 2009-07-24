window.onload = function()
{
		var toolBarBtn = Titanium.UI.createButton({systemButton:Titanium.UI.iPhone.SystemButton.REWIND});
		Titanium.UI.currentWindow.setToolbar([toolBarBtn]);
		var cpt=0;

		toolBarBtn.addEventListener('click',function()
		{
			Titanium.API.debug('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> CLICK EVENT with COUNT ' + cpt);
			$('#test1').html(cpt+"<br />"+cpt+"<br />"+cpt+"<br />"+cpt+"<br />"+cpt+"<br />"+cpt+"<br />"+cpt+"<br />"+cpt+"<br />"+cpt+"<br />"+cpt+"<br />"+cpt+"<br />"+cpt+"<br />"+cpt+"<br />"+cpt+"<br />"+cpt+"<br />");
			$('#test2').html(cpt+"<br />"+cpt+"<br />"+cpt+"<br />"+cpt+"<br />"+cpt+"<br />"+cpt+"<br />"+cpt+"<br />"+cpt+"<br />"+cpt+"<br />"+cpt+"<br />"+cpt+"<br />"+cpt+"<br />"+cpt+"<br />"+cpt+"<br />"+cpt+"<br />");
			$('#test3').html(cpt+"<br />"+cpt+"<br />"+cpt+"<br />"+cpt+"<br />"+cpt+"<br />"+cpt+"<br />"+cpt+"<br />"+cpt+"<br />"+cpt+"<br />"+cpt+"<br />"+cpt+"<br />"+cpt+"<br />"+cpt+"<br />"+cpt+"<br />"+cpt+"<br />");
			$('#test4').html(cpt+"<br />"+cpt+"<br />"+cpt+"<br />"+cpt+"<br />"+cpt+"<br />"+cpt+"<br />"+cpt+"<br />"+cpt+"<br />"+cpt+"<br />"+cpt+"<br />"+cpt+"<br />"+cpt+"<br />"+cpt+"<br />"+cpt+"<br />"+cpt+"<br />");
			cpt++;
		});

};
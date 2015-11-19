OptionDialog = {};
OptionDialog.view = Ti.UI.createView();

OptionDialog.init = function()
{
	var b1 = Ti.UI.createButton({
		title:'Options Dialog 1',
		height:50,
		width:300,
		top:100
	});
	OptionDialog.view.add(b1);

	var dialog1 = Titanium.UI.createOptionDialog({
		options:['Option 1', 'Option 2'],
		title:'Select an Option'
	});

	// build first popover
	b1.addEventListener('click', function()
	{
		dialog1.show({view:b1,animated:true});
	});

	var b2 = Ti.UI.createButton({
		title:'Options Dialog 2',
		height:50,
		width:300,
		top:170
	});
	OptionDialog.view.add(b2);

	// NOTE: on iPad cancel button is not displayed since clicking outside of the dialog
	// cancels the action (you can still track the button click though in the event listener)
	var dialog2 = Titanium.UI.createOptionDialog({
		options:['Option 1', 'Option 2', 'Option 3'],
		destructive:1,
		cancel:2,

	});

	// build first popover
	b2.addEventListener('click', function()
	{
		dialog2.show({view:b2,animated:true});
	});

};
function modal_windows(_args) {
	var win = Ti.UI.createWindow({
		title:_args.title
	});
	win.backgroundColor = 'black';
	
	
	var picker = Ti.UI.createPicker();
	
	var column1 = Ti.UI.createPickerColumn();
	column1.addRow(Ti.UI.createPickerRow({title:'Cover Vertical',style:Ti.UI.iPhone.MODAL_TRANSITION_STYLE_COVER_VERTICAL,fontSize:12}));
	column1.addRow(Ti.UI.createPickerRow({title:'Flip Horizontal',style:Ti.UI.iPhone.MODAL_TRANSITION_STYLE_FLIP_HORIZONTAL,fontSize:12}));
	column1.addRow(Ti.UI.createPickerRow({title:'Cross Dissolve',style:Ti.UI.iPhone.MODAL_TRANSITION_STYLE_CROSS_DISSOLVE,fontSize:12}));
	column1.addRow(Ti.UI.createPickerRow({title:'Partial Curl',style:Ti.UI.iPhone.MODAL_TRANSITION_STYLE_PARTIAL_CURL,fontSize:12}));
	
	var column2 = Ti.UI.createPickerColumn();
	column2.addRow(Ti.UI.createPickerRow({title:'Fullscreen',presentation:Ti.UI.iPhone.MODAL_PRESENTATION_FULLSCREEN,fontSize:12}));
	column2.addRow(Ti.UI.createPickerRow({title:'Page Sheet',presentation:Ti.UI.iPhone.MODAL_PRESENTATION_PAGESHEET,fontSize:12}));
	column2.addRow(Ti.UI.createPickerRow({title:'Form Sheet',presentation:Ti.UI.iPhone.MODAL_PRESENTATION_FORMSHEET,fontSize:12}));
	column2.addRow(Ti.UI.createPickerRow({title:'Current Ctx',presentation:Ti.UI.iPhone.MODAL_PRESENTATION_CURRENT_CONTEXT,fontSize:12}));
	
	picker.add([column1,column2]);
	
	// turn on the selection indicator (off by default)
	picker.selectionIndicator = true;
	
	win.add(picker);
	
	var button = Ti.UI.createButton({
		width:130,
		top:20,
		title:'Show Modal',
		height:30
	});
	
	win.add(button);
	
	button.addEventListener('click',function()
	{
		var style = picker.getSelectedRow(0).style;
		var presentation = picker.getSelectedRow(1).presentation;
		var w = Ti.UI.createWindow({
			backgroundColor:'purple'
		});
		var b = Ti.UI.createButton({
			title:'Close',
			width:100,
			height:30
		});
		b.addEventListener('click',function()
		{
			w.close();
		});
		w.add(b);
		w.open({modal:true,modalTransitionStyle:style,modalStyle:presentation,navBarHidden:true});
	});

	return win;
}

module.exports = modal_windows;
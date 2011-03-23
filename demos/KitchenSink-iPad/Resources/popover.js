Popover = {};
Popover.view = Ti.UI.createView();

// arrow directions
// Ti.UI.iPad.POPOVER_ARROW_DIRECTION_UP
// Ti.UI.iPad.POPOVER_ARROW_DIRECTION_DOWN
// Ti.UI.iPad.POPOVER_ARROW_DIRECTION_LEFT
// Ti.UI.iPad.POPOVER_ARROW_DIRECTION_RIGHT
// Ti.UI.iPad.POPOVER_ARROW_DIRECTION_ANY
// Ti.UI.iPad.POPOVER_ARROW_DIRECTION_UNKNOWN

Popover.init = function()
{
	var b1 = Ti.UI.createButton({
		title:'Show Popover 1',
		height:50,
		width:300,
		top:100
	});
	Popover.view.add(b1);


	// build first popover
	b1.addEventListener('click', function()
	{
		var close = Ti.UI.createButton({
			title:'Close'
		});
		var canc = Ti.UI.createButton({
			title:'Cancel'
		});
		canc.addEventListener('click', function()
		{
			popover.hide({animated:true});
		});
		close.addEventListener('click', function()
		{
			popover.hide({animated:true});
		});
		var popover = Ti.UI.iPad.createPopover({ 
			width:200, 
			height:350,
			title:'Table View',
			rightNavButton:close,
			leftNavButton:canc,
			barColor:'#111'
		}); 
		var searchBar = Ti.UI.createSearchBar({top:0,height:44,barColor:'#333'});

		var tableView = Ti.UI.createTableView({
			data:[{title:'Option 1'},{title:'Option 3'},{title:'Option 2'}],
			top:44,
			height:300
		});

		popover.add(searchBar)
		popover.add(tableView);

		popover.show({
			view:b1,
			animated:true,
		}); 

	});

	var b2 = Ti.UI.createButton({
		title:'Show Popover 2',
		height:50,
		width:300,
		top:170
	});
	Popover.view.add(b2);


	// build first popover
	b2.addEventListener('click', function()
	{
		var popover = Ti.UI.iPad.createPopover({ 
			width:200, 
			height:200,
			title:'Picker',
			arrowDirection:Ti.UI.iPad.POPOVER_ARROW_DIRECTION_RIGHT
		}); 
		var picker = Ti.UI.createPicker();

		var data = [
			{title:'Bananas',fontSize:20},
			{title:'Strawberries',fontSize:20},
			{title:'Mangos',fontSize:20,selected:true},
			{title:'Grapes',fontSize:20}
		];

		picker.add(data);
		picker.selectionIndicator = true;

		popover.add(picker)
		// TEST: #1282
		picker.setSelectedRow(0,1,true);
		popover.show({
			view:b2,
			animated:true,
		}); 

	});

	var b3 = Ti.UI.createButton({
		title:'Show Popover 3',
		height:50,
		width:300,
		top:240
	});
	Popover.view.add(b3);


	// build first popover
	b3.addEventListener('click', function()
	{
		var popover = Ti.UI.iPad.createPopover({ 
			width:300, 
			height:300,
			title:'Scrollable View',
			arrowDirection:Ti.UI.iPad.POPOVER_ARROW_DIRECTION_LEFT
		}); 

		var view1 = Ti.UI.createView({
			backgroundColor:'red'
		});
		var l1 = Ti.UI.createLabel({
			text:'View 1',
			color:'#fff',
			width:'auto',
			height:'auto'
		});
		view1.add(l1);

		var view2 = Ti.UI.createView({
			backgroundColor:'blue'
		});
		var l2 = Ti.UI.createLabel({
			text:'View 2',
			color:'#fff',
			width:'auto',
			height:'auto'
		});
		view2.add(l2);

		var view3 = Ti.UI.createView({
			backgroundColor:'green'
		});
		var l3 = Ti.UI.createLabel({
			text:'View 3',
			color:'#fff',
			width:'auto',
			height:'auto'
		});
		view3.add(l3);



		var scrollView = Titanium.UI.createScrollableView({
			views:[view1,view2,view3],
			showPagingControl:true,
			pagingControlHeight:30,
		});

		popover.add(scrollView)

		popover.show({
			view:b3,
		}); 

	});	
}
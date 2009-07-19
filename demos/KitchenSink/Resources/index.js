window.onload = function()
{
	
	// data for tableview
	var data = [
		{title:'Grouped View', hasChild:true},
		{title:'Alert'},
		{title:'Play Movie'},
		{title:'Camera'},
		{title:'Vibrate'},
		{title:'Orientation'},
		{title:'Photo Gallery'},
		{title:'Options Dialog'},
		{title:'Ajax Request'},
		{title:'Geo Location'},
		{title:'Composite View', hasChild:true}
		
	];
	
	// tableview object
	var tableView = Titanium.UI.createTableView({data:data,title:'Page 1',isPrimary:true,backgroundColor:'#336699'}, function(eventObject) 
	{
		// handle tableview click events
		var idx = eventObject.index;
		switch(idx)
		{
			case 0:
			{
				handleGroupedView();
				break;
			}
			case 1:
			{
				handleAlert();
				break;
			}
			case 2:
			{
				playMovie();
				break;
				
			}
			case 3:
			{
				showCamera();
				break;
			}
			case 4:
			{
				Titanium.Media.vibrate();
				break;
			}
			case 5:
			{
				var win = Titanium.UI.createWindow({url:'orientation.html',title:'Orientation Change', barColor:'#336699'});
				win.orientation ='either';
				win.open({animated:true});
				break;
				
			}
			case 6:
			{
				openPhotoGallery();
				break;
			}
			case 7:
			{
				showOptionsDialog();
				break;
			}
			case 8:
			{
				var win = Titanium.UI.createWindow({url:'xhr.html',title:'Ajax Request', barColor:'#336699'});
				win.open({animated:true});
				break;
			}
			case 9:
			{
				var win = Titanium.UI.createWindow({url:'geo.html',title:'Geolocation', barColor:'#336699'});
				win.open({animated:true});
				break;
				
			}
			case 10:
			{
				handleCompositeView();
				break;
			}
			case 11:
			{
				var win = Titanium.UI.createWindow({url:'shake.html',title:'Shake', barColor:'#336699'});
				win.open({animated:true});
				break;
			}

		}

	});
	
	// open tableview
	tableView.open({animated:false});

	//
	// show options dialog
	//
	function showOptionsDialog()
	{
		// create dialog
		var dialog = Titanium.UI.createOptionDialog();

		// set button titles
		dialog.setOptions(["Pick A","Pick B","cancel"]);

		// set index for destructive button (IPHONE ONLY)
		dialog.setDestructive(1);

		// set index for cancel (IPHONE ONLY)
		dialog.setCancel(2);

		// set title
		dialog.setTitle('My Title');

		// add event listener
		dialog.addEventListener('click',function(event)
		{
			// a.setMessage('you clicked ' + event.index);
			// a.show();
		});

		// show dialog
		dialog.show();
		
	};
	//
	// open photo gallery
	//
	function openPhotoGallery()
	{
		Titanium.Media.openPhotoGallery({
			success: function(image,details)
			{
				var win = Titanium.UI.createWindow();
				win.setURL('image.html');
				Titanium.App.Properties.setString('photo',image.url);
				if (details) {
					Titanium.App.Properties.setString('x',details.cropRect.x);
					Titanium.App.Properties.setString('y',details.cropRect.y);
					Titanium.App.Properties.setString('height',details.cropRect.height);
					Titanium.App.Properties.setString('width',details.cropRect.width);
				} else {
					Titanium.App.Properties.setString('x',0);
					Titanium.App.Properties.setString('y',0);
					Titanium.App.Properties.setString('height',image.height);
					Titanium.App.Properties.setString('width',image.width);
				}
				win.open({animated:true});
			},
			error: function(error)
			{
				Titanium.UI.createAlertDialog( {
					title: "Error from Gallery",
					message: error.message,
					buttonNames: OK
				} ).show();
			},
			cancel: function()
			{

			},
			allowImageEditing:true
		});
		
	};
	
	//
	// play movie
	//
	function playMovie()
	{
		var activeMovie = Titanium.Media.createVideoPlayer({
				contentURL:'movie.mp4',
				backgroundColor:'#111',
				movieControlMode:Titanium.Media.VIDEO_CONTROL_DEFAULT,
				scalingMode:Titanium.Media.VIDEO_SCALING_MODE_FILL
		});

		// play movie
		activeMovie.play();		
	};
	
	//
	// show camera
	// 
	function showCamera()
	{
		Titanium.Media.showCamera({

			success:function(image,details)
			{
				var win = Titanium.UI.createWindow();
				win.setURL('image.html');
				Titanium.App.Properties.setString('photo',image.url);
				if (details){
					Titanium.App.Properties.setString('x',details.cropRect.x);
					Titanium.App.Properties.setString('y',details.cropRect.y);
					Titanium.App.Properties.setString('height',details.cropRect.height);
					Titanium.App.Properties.setString('width',details.cropRect.width);
				}
				win.open({animated:true});

			},
			cancel:function()
			{

			},
			error:function(error)
			{
				// create alert
				var a = Titanium.UI.createAlertDialog();

				// set title
				a.setTitle('Camera Error');

				// set message
				if (error.code = Titanium.Media.NO_CAMERA)
				{
					a.setMessage('Device does not have camera');
				}
				else
				{
					a.setMessage('Unexpected error: ' + error.code);
				}

				// set button names
				a.setButtonNames(['OK']);

				// show alert
				a.show();
			},
			allowImageEditing:true
		});
		
		break;
		
	};
	//
	// this test creates a grouped view
	//
	function handleGroupedView()
	{
		var a = Titanium.UI.createAlertDialog({title:'Grouped View Test', buttonNames:['OK']});
		
		var buttonData = [
			{title:'Button 1'},
			{title:'Button 2'}
		];

		var bar = Titanium.UI.createButtonBar({labels:['Button 1', 'Button 2'], color:'#336699'});
		Titanium.UI.currentWindow.setRightNavButton(bar);
		
		var buttonSection = Titanium.UI.iPhone.createGroupedSection({footer:'Button Group Footer', header:'Button Group', type:'button',data:buttonData});
		buttonSection.addEventListener('click',function(e)
		{
			a.setMessage('You clicked index ' + e.index + ' section row ' + e.row + ' section ' + e.section);
			a.show();
		});

		var optionData = [
			{title:'Option 1'},
			{title:'Option 2' , selected:true},
			{title:'Option 3'}	
		];

		var optionSection = Titanium.UI.iPhone.createGroupedSection({header:'Option Group', type:'option', data:optionData});
		optionSection.addEventListener('click',function(e)
		{
			a.setMessage('You clicked index ' + e.index + ' section row ' + e.row + ' section ' + e.section);
			a.show();
		});

		var switchInstance = Titanium.UI.createSwitch({value:true});
		switchInstance.addEventListener('change',function(e)
		{
			a.setMessage(e.value)
			a.show();
		})
		
		var sliderInstance = Titanium.UI.createSlider({min:0,max:10,value:5, width:150});
		sliderInstance.addEventListener('change',function(e)
		{
			a.setMessage(e.value)
			a.show();
		})
		var textInstance = Titanium.UI.createTextField({value:'Nolan',width:50});
		textInstance.addEventListener('change',function(e)
		{
			a.setMessage(e.value)
			a.show();
		})

		var inputData = [
			{title:'Input 1', input:switchInstance},
			{title:'Sound', input:sliderInstance},
			{title:'Name', input:textInstance},
			{title:'Input 2', value:'foo', hasChild:true},
			{title:'Input 3'}	
		];

		var inputSection = Titanium.UI.iPhone.createGroupedSection({header:'Input Group', type:'input', data:inputData});
		inputSection.addEventListener('click',function(e)
		{
			a.setMessage('You clicked index ' + e.index + ' section row ' + e.row + ' section ' + e.section);
			a.show();
		});
		
		// create grouped view  
		var groupedView = Titanium.UI.iPhone.createGroupedView();
		groupedView.addSection(optionSection);
		groupedView.addSection(buttonSection);
		groupedView.addSection(inputSection);
		groupedView.open({animated:true});
	};
	
	//
	// this test shows an alert and pops up another alert indicating the button index you clicked
	//
	function handleAlert()
	{
		var a = Titanium.UI.createAlertDialog({message:'Hello World', title:'Alert!', buttonNames:['OK','Cancel']});
		a.show();
		a.addEventListener('click',function(e)
		{
			b.setMessage('You clicked ' + e.index);
			b.show();
		})

		var b = Titanium.UI.createAlertDialog({buttonNames:['OK','Cancel']});
	};
	
	function handleCompositeView()
	{
		var win = Titanium.UI.createWindow({url:'composite.html'});
		win.open({animated:true})
	};
};
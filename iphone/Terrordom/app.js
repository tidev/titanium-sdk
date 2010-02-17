var tableView = Titanium.UI.createTableView({
	backgroundColor:'transparent',
	borderColor:'transparent'
});


//
// view-level event handler
//
function buttonHandler(e)
{
	// row object
	var row = e.row;
	
	// properties on row object
	var index = row.index;
	var section = row.section;
	var rowNum = row.row;
	var customProp = row.foo;
	
	// get button
	var button = row[0];
	
	// set button title
	button.title = 'you clicked me';
};

var tableData = 
[
	{title:'Make editable',name:'edit'},
	{title:'Make moveable',name:'move'},
	{title:'Non editable field',name:'nonedit',editable:false},
	{title:'Non moveable field',name:'nonmove',moveable:false},
];

var datax = 
[
	{title:'row 1 has a lot of text and by a lot a text, I mean a metric buttload. A metric buttload is much larger than an imperial buttload, but why this is is lost to the annals of time. I think it has to do something with someone chugging down a 2 liter bottle of soda vs a 12 ounce can.', hasChild:true,fontWeight:'bold',fontSize:'36px',backgroundColor:'#00FFFF'},
	{title:'row 2', hasDetail:true,fontWeight:'normal',fontSize:'6px',layout:null,editable:false},
	{indentionLevel:1,title:'Reference Row',backgroundColor:'#00FFFF',selectionStyle:'none',layout:null,name:'3'},
	{html:'<b>row</b> 4 has <i>html?</i>',selected:true,layout:null},
	
	{rowHeight:50,title:'Layout test1',image:'images/Phone.png',layout:[{top:0,height:30,bottom:null,fontSize:'20px'},{type:'image',name:'image',top:0,height:40,left:5,width:40}]},
	
	{title:'row 1', hasChild:true, image:'images/Mail.png',backgroundColor:'#00FFFF'},
	{title:'row 2', hasDetail:true, image:'images/Safari.png',selectionStyle:'gray',layout:null},
	{title:'row 3', image:'images/Phone.png',selectionStyle:'blue',layout:null},
	{title:'row 4', image:'images/iTunes.png',backgroundColor:'#00FFFF'},
	
	{title:'row 1', hasChild:true, image:'Mail.png'},
	{title:'row 2', hasDetail:true, image:'Safari.png'},
	{title:'row 3', image:'images/Phone.png'},
	{title:'row 4', image:'images/iTunes.png'},
	
	{title:'row 1', header:'Header 1', headerColor:'red', headerFont:'marker felt', hasChild:true, },
	{title:'row 2', hasDetail:true},
	{title:'row 3'},
	{title:'row 4'},
	{title:'row 5', header:'Header 2', hasChild:true, },
	{title:'row 6', hasDetail:true},
	{title:'row 7'},
	{title:'row 8'},
	{title:'row 9', header:'Header 3', hasChild:true, },
	{title:'row 10', hasDetail:true},
	{title:'row 11',selected:true},
	{title:'row 12'},
	
	{html:'<div><div style="font-weight:bold;font-size:18px">Row 1</div><div style="font-size:11px;margin-top:5px;">row 1 detail...</div></div>',hasChild:true,layout:null},
	{html:'<div><div style="font-weight:bold;font-size:18px">Row 2</div><div style="font-size:11px;margin-top:5px;">row 2 detail...</div></div>',hasChild:true,layout:null},
	{html:'<div><div style="font-weight:bold;font-size:18px">Row 3</div><div style="font-size:11px;margin-top:5px;">row 3 detail...</div></div>',selected:true,layout:null},
	{html:'<div><div style="font-weight:bold;font-size:18px">Row 4</div><div style="font-size:11px;margin-top:5px;">row 4 detail...</div></div>',layout:null},
	{html:'<div><div style="font-weight:bold;font-size:18px">Row 5</div><div style="font-size:11px;margin-top:5px;">row 5 detail...</div></div>',layout:null}					
];

var template = 
{
	selectedBackgroundImage:'images/table_view_bg.png', 
	selectedColor:'white',
	color:'brown',
	rowHeight:'auto',
	xlayout:
	[
		{type:'text', left:50, selectedColor:'red', color:'#336699', name:'title', textAlign:'right', fontWeight:'bold', top:10, bottom:10, height:'auto', fontFamily:'Marker Felt'}
	]
};	

var searchBar = Ti.UI.createSearchBar({showCancel:true,barColor:'#990000'});

var tableViewProps = 
{
	data: tableData,
	template: template,
	search: searchBar,
	editable: true
};



try
{
//	var tableView = Titanium.UI.createTableView();
	

	var tabGroup = Titanium.UI.createTabGroup();
	var tab1 = Titanium.UI.createTab({icon:'images/KS_nav_phone.png',title:'Table View',badge:null});
	var tab2 = Titanium.UI.createTab({icon:'images/KS_nav_phone.png',title:'Tab 2',badge:null});
	var tab3 = Titanium.UI.createTab({icon:'images/KS_nav_phone.png',title:'Tab 3',badge:null});
	var tab4 = Titanium.UI.createTab({icon:'images/KS_nav_phone.png',title:'Tab 4',badge:null});
	var tabX = Titanium.UI.createTab({icon:'images/KS_nav_phone.png',title:'Tab X',badge:null});

	var tab6 = Titanium.UI.createTab({icon:'images/KS_nav_phone.png',title:'Tab 6',badge:null});


	tabGroup.addTab(tabX);
	tabGroup.addTab(tab1);
	tabGroup.addTab(tab2);
	tabGroup.addTab(tab3);
	tabGroup.addTab(tab4);
	tabGroup.addTab(tab6);

	tabX.open(Ti.UI.createWindow({url:'rawtest.js',backgroundColor:'669933'}),{animated:true});
	tab6.open(Ti.UI.createWindow({url:'scrollable.js',backgroundColor:'669933'}));

	
	var tab1win = Ti.UI.createWindow({url:'subapp.js'});
	var tab2win = Ti.UI.createWindow({url:'audio.js'});
	var tab4win = Ti.UI.createWindow({url:'tab1.js'});
	
	
	var tablewin = Ti.UI.createWindow();
	tablewin.add(tableView);
	
	/*
	var inputData = [
		{title:'Subject', value:'Blah'},
	];

	var inputSection = Titanium.UI.iPhone.createGroupedSection({
		header:'Select a Subject',
		type:'input',
		data:inputData
	});
	
	groupedView = Titanium.UI.iPhone.createGroupedView();
	groupedView.addSection(inputSection);
	tablewin.add(groupedView);
*/
	tab1.open(tablewin, {animated:true});
	
	var b = Titanium.UI.createButton({
		title:'Cancel',
		style:Titanium.UI.iPhone.SystemButtonStyle.DONE
	});
	b.addEventListener('click',function()
	{
		Ti.API.debug("nav bar button clicked");
		//tableView.editing = false;
		///tableView.moving = false;
		tabGroup.tabs[1].active = true;
		Ti.API.debug("active tab is = "+tabGroup.activeTab);
	});
	tablewin.setRightNavButton(b);
	tablewin.setBarColor('#222');
	tablewin.title = 'Table View Demos';

	var titleControl = Titanium.UI.createButton({
		systemButton:Titanium.UI.iPhone.SystemButton.CONTACT_ADD
	});
	// var buttonBar = Titanium.UI.createButtonBar({
	// 		id:'buttonbar', 
	// 		labels:['Invitatório','Leituras']
	// 	});
//	var tabbar = Titanium.UI.createTabbedBar({labels:['Tab1', 'Tab2'],index:1});
	var tabbar = Titanium.UI.createTabbedBar({labels:['Tab1', 'Tab2'],index:1,backgroundColor:'#091'});
	tablewin.setLeftNavButton(tabbar);
	tabbar.addEventListener('click',function(e)
	{
//		Ti.UI.createLabelDialog({title:'Tab Bar',message:'You clicked: '+e.index}).show();
	});
	
	var titleLabel = Titanium.UI.createLabel({text:'Titanium 0.9',width:'auto',color:'#900',font:{fontFamily:'Marker Felt',fontSize:28}});
	
	var titleControl2 = Titanium.UI.createButton({
		title:'Hello',height:25,width:70
	});
	
	tablewin.setTitleControl(titleLabel);
	

	tab2.open(tab1win, {animated:true,title:'Tab 2'});
	tab3.open(tab2win, {animated:true,title:'Tab 3'});
	tab4.open(tab4win, {animated:true});
	
	tabGroup.open();
	
// 	/*
// 	var a = Titanium.UI.createAlertDialog({title:'Alert Test',message:'it worked',buttonNames:['OK','Cancel']});
// 	a.show();
// 	var ab = Titanium.UI.createAlertDialog({buttonNames:['OK']});
// 	ab.setTitle('Click Event');
// 	a.addEventListener('click',function(e)
// 	{
// 		if (e.index == 0)
// 		{
// 			ab.setMessage('You clicked OK');
// 		}
// 		else
// 		{
// 			ab.setMessage('You clicked Cancel');
// 		}
// 		ab.show();
// 	});*/
// 	
	var flexSpace = Titanium.UI.createButton({
		systemButton:Titanium.UI.iPhone.SystemButton.FLEXIBLE_SPACE
	});

	var b1 = Titanium.UI.createButton({
		systemButton:Titanium.UI.iPhone.SystemButton.ACTION
	});
	var b2 = Titanium.UI.createButton({
		systemButton:Titanium.UI.iPhone.SystemButton.CAMERA
	});
	var b3 = Titanium.UI.createButton({
		systemButton:Titanium.UI.iPhone.SystemButton.COMPOSE
	});
	var b4 = Titanium.UI.createButton({
		systemButton:Titanium.UI.iPhone.SystemButton.BOOKMARKS
	});
	var b5 = Titanium.UI.createButton({
		systemButton:Titanium.UI.iPhone.SystemButton.REFRESH
	});
	
	var fixSpace = Titanium.UI.createButton({
		systemButton:Titanium.UI.iPhone.SystemButton.FIXED_SPACE,
		width:20
	});

	b1.addEventListener('click',function()
	{
		tablewin.setToolbar(null,{animated:true});
	});
	b2.addEventListener('click',function()
	{
		tablewin.showNavBar({animated:true});
	});
	b3.addEventListener('click',function()
	{
		tablewin.hideNavBar({animated:true});
	});
	b4.addEventListener('click',function()
	{
		tablewin.titlePrompt = 'titanium rules';
	});
	b5.addEventListener('click',function()
	{
		tablewin.barColor = '#903';
		searchBar.barColor = '#903';
		
		var w2 = Ti.UI.createWindow();
		tab1.open(w2, {animated:true,title:'Tab 1 Win 2'});
		w2.addEventListener('blur',function()
		{
			Ti.API.debug("tab blured: "+w2);
			tab1.close(w2);
		});
	});
	
	tablewin.setToolbar([b1,flexSpace,b2,flexSpace,b3,flexSpace,b4,flexSpace,b5,fixSpace]);
	
	tableView.addEventListener('click',function(e)
	{
		Ti.API.debug("clicked on "+e.rowData.name);
		
		switch (e.rowData.name)
		{
			case 'edit':
			{
				Ti.API.debug("before click on edit = "+tableView.editing);
				tableView.editing = true;
				break;
			}
			case 'move':
			{
				Ti.API.debug("before click on move = "+tableView.moving);
				tableView.moving = true;
			}
		}
	});
	
	//tableView.editable = true;
	
	//tableView.setEditing(true,{animated:0,moveable:1});
	/*"The Ent
	tableView.index = [
		{title:'T',index:0},
		{title:'M',index:13},
		{title:'B',index:data.length-1}
	];*/
	
	tableView.addEventListener('delete',function(e)
	{
		Ti.API.debug("deleted - row="+e.row+", index="+e.index+", section="+e.section);
		tableView.setEditing(false,{animated:1});
		tableView.search = null;
	});

	tableView.addEventListener('insert',function(e)
	{
		Ti.API.debug("insert - row="+e.row+", index="+e.index+", section="+e.section);
		tableView.setEditing(false,{animated:1});
	});

	tableView.addEventListener('move',function(e)
	{
		Ti.API.debug("move - row="+e.row+", index="+e.index+", section="+e.section+", from = "+e.fromIndex);
	});
	
	var cork = Ti.UI.createWindow({backgroundImage:'images/corkboard.jpg'});
	
	function createPic(x,y,name)
	{
		var left = ( (320 - 75) / 2 ) - x;
		var top = ( (400 - 75) / 2 ) - y;
		var pic = Ti.UI.createView({backgroundImage:'images/'+name+'.jpg',borderWidth:4,borderColor:'white',width:75,height:75,top:top,left:left});
		cork.add(pic);

		pic.addEventListener('touchstart',function()
		{
			var an = Ti.UI.create2DMatrix();
			an = an.scale(1.1);
			pic.animate({transform:an},{duration:0.5});
		});
		pic.addEventListener('touchmove',function(e)
		{
			pic.animate({center:{x:e.x,y:e.y}},{duration:0.1});
		});
		pic.addEventListener('touchend',function()
		{
			var an = Ti.UI.create2DMatrix();
			pic.animate({transform:an},{duration:0.5});
		});
	}
	
	createPic(-25,-25,'smallpic1');
	createPic(0,0,'smallpic2');
	createPic(25,25,'smallpic3');
	
	cork.setTitle('Cork Board');
	cork.setColor('#111');
	cork.hideNavBar();
	
	var corkDiv = Titanium.UI.createView({backgroundColor:'#000',opacity:0,borderRadius:9,height:30,width:200,bottom:20});
	var corkLabel = Titanium.UI.createLabel({text:'Drag the photos',color:'white',font:{fontFamily:'marker felt',fontSize:15},textAlignment:'center'});
	corkDiv.add(corkLabel);
	cork.add(corkDiv);
		
	cork.addEventListener('focus',function()
	{
		corkDiv.animate({opacity:0.8},{duration:1500}).animate({opacity:0},{delay:2000});
		var optional = Ti.UI.createOptionDialog({title:'Thingy!'});
		optional.show();

	});
	
	
	tab4.open(cork, {animated:true});
	
	//This is in Kroll now
	Ti.API.debug("json = "+JSON.stringify(JSON.parse("{\"a\":1}")));
	
	var props = Ti.App.Properties.listProperties();
	for (var c=0;c<props.length;c++)
	{
		var key = props[c];
		Ti.API.debug("App.properties > "+key+"="+Ti.App.Properties.getString(key));
	}
	Ti.App.Properties.setString("Foo","Bar");
	Ti.API.debug("Foo should be true ==> "+Ti.App.Properties.hasProperty("Foo"));
	Ti.API.debug("Foo should be Bar = "+Ti.App.Properties.getString("Foo"));
	Ti.App.Properties.removeProperty("Foo");
	Ti.API.debug("Foo should be false ==> "+Ti.App.Properties.hasProperty("Foo"));
	
	Ti.API.debug("app data dir is = "+Ti.Filesystem.applicationDataDirectory);
	Ti.API.debug("app data dir is = "+Ti.Filesystem.getApplicationDataDirectory());
	Ti.API.debug("app.js exists in data dir? = "+Ti.Filesystem.getFile('app.js').exists());
	
	/*
	inputSection.addEventListener('click',function(e)
	{
		var r = Titanium.UI.iPhone.createGroupedSection({
			header:'Select a Color',
			type:'input',
			data:inputData
		});
		groupedView.setSections(r,{animated:true});
	});*/
	
	var ts = new Date().getTime();
	
	/*
	setInterval(function()
	{
		Ti.API.debug("timer fired after " + (new Date().getTime()-ts) + " ms");
	},1000);*/
	
	
	/*
	Ti.Accelerometer.addEventListener('update',function(e)
	{
	 	Ti.API.debug("accelerometer updated: x="+e.x+",y="+e.y+",z="+e.z+",ts="+e.timestamp);
	});*/
	
	/*Ti.Geolocation.addEventListener('location',function(e)
	{
		Ti.API.debug("geo location updated = "+JSON.stringify(e));
	});*/

	Ti.Geolocation.getCurrentPosition(function(e)
	{
		Ti.API.debug("geo location found = "+JSON.stringify(e));
	});

	Ti.Geolocation.getCurrentHeading(function(e)
	{
		Ti.API.debug("geo heading found = "+JSON.stringify(e));
	});
	
	Ti.Gesture.addEventListener('shake',function(e)
	{
		Ti.API.debug("device has shaken  == timestamp=>"+e.timestamp);
	});
	
	Ti.Gesture.addEventListener('orientationchange',function(e)
	{
		Ti.API.debug("orientation changed = "+e.orientation+", is portrait?"+e.source.isPortrait()+", orientation = "+Ti.Gesture.orientation);
	});
	
	/*
	var player = Ti.Media.createSound("sound.wav");
	player.addEventListener('complete',function()
	{
		Ti.API.debug("player finished playing");
		player.release();
	});
	player.play();*/
	
	
	/*
	var activeMovie = Titanium.Media.createVideoPlayer({
		contentURL:'movie.m4v',
		backgroundColor:'#111',
		movieControlMode:Titanium.Media.VIDEO_CONTROL_DEFAULT,
		scalingMode:Titanium.Media.VIDEO_SCALING_MODE_FILL
	});
	
	var movieLabel = Titanium.UI.createLabel({text:'Check out this cool video',top:30,left:20,width:400,height:25,font:{fontSize:24,fontFamily:'Marker Felt'},color:'red'});
	activeMovie.add(movieLabel);
	movieLabel.addEventListener('click',function()
	{
		movieLabel.text = "You clicked the video label. Sweet!";
	});

	activeMovie.addEventListener('load',function()
	{
		Ti.API.debug("movie loaded and starting to play");
	});
	activeMovie.addEventListener('complete',function()
	{
		Ti.API.debug("movie completed playing");
	});
	
	activeMovie.play();
	*/
	
	Ti.API.debug("proximity detection = "+Ti.App.proximityDetection+", state=  "+Ti.App.proximityState);

	Ti.App.addEventListener('proximity',function(e)
	{
		Ti.API.debug("proximity state changed = "+e.state);
	});
	
	Ti.App.proximityDetection = true;
	
	/*
	// this is pretty cool, turn any titanium view in to an image blob and pass an image blob to an image view to render
	var img = tabGroup.toImage();
	var imgWindow = Ti.UI.createWindow();
	var imgView = Ti.UI.createImageView({image:img});
	imgWindow.add(imgView);
	imgWindow.open();
	*/
	
	
	// Titanium.Media.openPhotoGallery({
	// 	success: function(event)
	// 	{
	// 		Ti.API.debug("photo gallery success media was = "+event.media);
	// 		Ti.API.debug("photo gallery success = "+JSON.stringify(event));
	// 		
	// 		/*
	// 		var imgWindow = Ti.UI.createWindow();
	// 		var imgView = Ti.UI.createImageView({image:event.media});
	// 		imgWindow.add(imgView);
	// 		imgWindow.open();*/
	// 		
	// 		/*
	// 		var emailDialog = Titanium.UI.createEmailDialog()
	// 		emailDialog.setSubject('foo');
	// 		emailDialog.setToRecipients(['foo@yahoo.com']);
	// 		emailDialog.setCcRecipients(['bar@yahoo.com']);
	// 		emailDialog.setBccRecipients(['obama@whitehouse.gov']);
	// 		emailDialog.setMessageBody('this is a test message');
	// 		emailDialog.addAttachment(image);
	// 		emailDialog.setBarColor('#336699');
	// 		emailDialog.open();
	// 		*/
	// 	},
	// 	error: function(error)
	// 	{
	// 	},
	// 	cancel: function()
	// 	{
	// 		Ti.API.debug("photo gallery cancelled");
	// 	},
	// 	allowImageEditing:true
	// });
	
	// Titanium.Media.showCamera({
	// 
	// 	success:function(event)
	// 	{
	// 		// var win = Titanium.UI.createWindow({url:'image.html'});
	// 		// Titanium.App.Properties.setString('video',media.url);
	// 		// Titanium.App.Properties.setBool('movie',true);
	// 		// win.open({animated:true});
	// 		
	// 		var video = event.media;
	// 		var thumbnail = event.thumbnail;
	// 		Ti.API.debug("video success. thumbnail = "+thumbnail+", video="+video);
	// 	},
	// 	cancel:function()
	// 	{
	// 
	// 	},
	// 	error:function(error)
	// 	{
	// 		Titanium.API.info("getting error = "+error);
	// 
	// 		// create alert
	// 		var a = Titanium.UI.createAlertDialog();
	// 
	// 		// set title
	// 		a.setTitle('Camera Error');
	// 
	// 		// set message
	// 		if (error.code == Titanium.Media.NO_VIDEO)
	// 		{
	// 			a.setMessage('Device does not have video recording capabilities');
	// 		}
	// 		else
	// 		{
	// 			a.setMessage('Unexpected error: ' + error.code);
	// 		}
	// 
	// 		// set button names
	// 		a.setButtonNames(['OK']);
	// 
	// 		// show alert
	// 		a.show();
	// 	},
	// 	allowImageEditing:true,
	// 	mediaTypes: Titanium.Media.MEDIA_TYPE_VIDEO,
	// 	videoMaximumDuration:10000,
	// 	videoQuality:Titanium.Media.QUALITY_HIGH
	// });
	
	Ti.Platform.addEventListener('battery',function(e)
	{
		Ti.API.debug("battery state changed = "+e.state+", level = "+e.level);
	})
	
	Ti.API.debug("battery level = "+Ti.Platform.batteryLevel+", state="+Ti.Platform.batteryState);
	Ti.API.debug("device unique id = "+Ti.Platform.id);
	
	
	var db = Titanium.Database.open('mydb');
	var html = '';

	db.execute('CREATE TABLE IF NOT EXISTS DATABASETEST  (ID INTEGER, NAME TEXT)');
	db.execute('DELETE FROM DATABASETEST');

	db.execute('INSERT INTO DATABASETEST (ID, NAME ) VALUES(?,?)',1,'Name 1');
	db.execute('INSERT INTO DATABASETEST (ID, NAME ) VALUES(?,?)',2,'Name 2');
	db.execute('INSERT INTO DATABASETEST (ID, NAME ) VALUES(?,?)',3,'Name 3');
	db.execute('INSERT INTO DATABASETEST (ID, NAME ) VALUES(?,?)',4,'Name 4');
	html += 'JUST INSERTED, rowsAffected = ' + db.rowsAffected + '\n';
	html += 'JUST INSERTED, lastInsertRowId = ' + db.lastInsertRowId + '\n';
	
	var rows = db.execute('SELECT * FROM DATABASETEST');
	html += 'row count = ' + rows.getRowCount() + '\n';
	
	while (rows.isValidRow())
	{
		html += 'ID: ' + rows.field(0) + ' NAME: ' + rows.fieldByName('name') + '\n';
		rows.next();
	}
	
	// close database
	rows.close();
	db.close();
	
	Ti.API.debug("database results = "+html);
	
/*
	var mapview = Titanium.Map.createView({
		xmapType: Titanium.Map.HYBRID_TYPE,
		region: {latitude:33.74511, longitude:-84.38993, latitudeDelta:0.01, longitudeDelta:0.01},
		animate:true,
		regionFit:true,
		userLocation:true,
		annotations:[
			{
				latitude:37.390749,
				longitude:-122.081651,
				title:"Appcelerator Headquarters",
				subtitle:'Mountain View, CA',
				pincolor:Titanium.Map.ANNOTATION_RED,
				animate:true,
				leftButton: 'images/appcelerator_small.png'
			},
			{
				latitude:37.33168900,
				longitude:-122.03073100,
				title:"Steve Jobs",
				subtitle:'Cupertino, CA',
				pincolor:Titanium.Map.ANNOTATION_GREEN,
				animate:true,
				rightButton: 'images/apple_logo.jpg'
			},
			{
				latitude:33.74511,
				longitude:-84.38993,
				title:"Atlanta, GA",
				subtitle:'Atlanta Braves Stadium',
				pincolor:Titanium.Map.ANNOTATION_PURPLE,
				animate:true,
				leftButton:'images/atlanta.jpg',
				rightButton: Titanium.UI.iPhone.SystemButton.DISCLOSURE 
			}
		]
	});
	var mapwin = Titanium.UI.createWindow();
	mapwin.add(mapview);
	mapwin.open();
	
	mapview.addEventListener('click',function(evt)
	{
		Ti.API.info('you clicked on '+evt.title+' with click source = '+evt.clicksource);

		if (evt.title == 'Atlanta, GA' && evt.clicksource == 'rightButton')
		{
			Ti.API.debug("clicked on atlanta's right button => "+evt.annotation);
			
			// test changing the annotation on the fly
			evt.annotation.rightView = Titanium.UI.createView({width:20,height:20,backgroundColor:'red'});
			evt.annotation.title = "Atlanta?";
			evt.annotation.pincolor = Titanium.Map.ANNOTATION_GREEN;
			evt.annotation.subtitle = 'Appcelerator used to be near here';
			evt.annotation.leftButton = 'images/appcelerator_small.png';
			
			Ti.API.debug("annotations = "+mapview.annotations);
		}
	});
*/

/*
	var mickeyFound = false;
	
	var contacts = Titanium.Contacts.getAllContacts();
	for (var c=0;c<contacts.length;c++)
	{
		Titanium.API.debug("first name = "+contacts[c].firstName);
		if (contacts[c].firstName == "Mickey" && contacts[c].lastName=="Mouse")
		{
			mickeyFound = true;
		}
	}
	
	if (mickeyFound==false)
	{
		var contact = Ti.Contacts.createContact();
		contact.firstName = "Mickey";
		contact.lastName = "Mouse";
		contact.save();
	}
	
	Titanium.Contacts.showContactPicker({

	   	success:function(e)
	   	{
			Ti.API.debug("contact picker success = "+e.contact.firstName+", selected field = "+e.key+", index = "+e.index);
			Ti.API.debug("contact image = "+e.contact.imageData);
	   	},
	   	cancel:function()
	   	{
			Ti.API.debug("cancel contact picker");
	   	},
	   	details:['firstName','lastName','phone','email', 'organization', 'birthday']
	});
*/

/*
	Ti.Facebook.addEventListener('login',function()
	{
		Ti.API.debug("facebook login = "+JSON.stringify(Ti.Facebook.permissions));
		Ti.API.debug("facebook session = "+JSON.stringify(Ti.Facebook.session));
		
		Titanium.Facebook.query("SELECT uid, name, pic_square, status FROM user where uid IN (SELECT uid2 FROM friend WHERE uid1 = " + Titanium.Facebook.getUserId() + ") order by last_name",function(r)
		{
			Ti.API.debug("Facebook execute returned: " + JSON.stringify(r));
		});
	});

	var fbbutton = Titanium.Facebook.createLoginButton({
		'id':'fb',
		'style':'wide',
		'apikey':'9494e611f2a93b8d7bfcdfa8cefdaf9f',
		'secret':'a65766d631c8e6f73f0fafc84b9885bc',
		'xsessionProxy':'http://api.appcelerator.net/p/fbconnect/'
	});
	
	fbbutton.addEventListener('login',function(e)
	{
		Ti.API.debug("facebook login = "+Ti.Facebook.permissions);
	});
	fbbutton.addEventListener('logout',function(e)
	{
		Ti.API.debug("facebook logout");
	});
	fbbutton.addEventListener('cancel',function(e)
	{
		Ti.API.debug("facebook cancel");
	});
	
	var fbwin = Titanium.UI.createWindow({backgroundColor:'black'});
	fbwin.add(fbbutton);
	fbwin.open();
	
	Ti.API.debug("Facebook logged in = "+Ti.Facebook.isLoggedIn());
	Ti.API.debug("Facebook logged in (prop) = "+Ti.Facebook.loggedIn);
*/	

/*	
	var consumerKey = 'dj0yJmk9VWFyZkNSWktpY3h3JmQ9WVdrOVNqWk5Nazl2TXpBbWNHbzlNVGc0TWpNNE9ERXhOZy0tJnM9Y29uc3VtZXJzZWNyZXQmeD04MQ--';
	var sharedSecret = '13631ad61af05628c28fc38e7226442398d0a4c2';
	Titanium.Yahoo.setOAuthParameters(consumerKey,sharedSecret);
	Titanium.Yahoo.yql("select * from flickr.photos.search where text='Barcelona'",function(ev)
	{
		for (var c=0;c<ev.data.photo.length;c++)
		{
			var photo = ev.data.photo[c];
			var url = 'http://farm' + photo.farm + '.static.flickr.com/' + photo.server + '/' + photo.id + '_' + photo.secret + '_m.jpg';
			Ti.API.debug(url);
		}
	});
*/
/*	
	var canvaswin = Ti.UI.createWindow({width:200,height:200});
	var canvas = Ti.UI.createCanvasView();
	canvaswin.add(canvas);
	canvaswin.open();
	
	canvas.begin();
	canvas.fillStyle = 'green';
	canvas.fillRect(0,0,100,100);
	canvas.lineWidth = 20;
	canvas.strokeStyle = '#f00';
	canvas.strokeRect(20,20,100,100);
	canvas.fillStyle = '#900';
	canvas.shadow(2,2,10,'#111');
	canvas.fillRect(20,20,100,100);
	canvas.lineCap = 'square';
	// canvas.beginPath();
	// canvas.moveTo(50,0);
	// canvas.lineTo(100,100);
	// canvas.fill();
	// canvas.closePath();
	canvas.commit();
*/	
}
catch(EX)
{
	Ti.API.error("Error = "+EX);
}


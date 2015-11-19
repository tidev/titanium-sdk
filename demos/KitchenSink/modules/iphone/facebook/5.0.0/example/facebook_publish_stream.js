exports.window = function(value){
	var win = Titanium.UI.createWindow({title:'Publish Stream'});
	var fb = require('facebook');
	function showRequestResult(e) {
		var s = '';
		if (e.success) {
			s = "SUCCESS";
			if (e.result) {
				s += "; " + e.result;
			}
			if (e.data) {
				s += "; " + e.data;
			}
			if (!e.result && !e.data) {
				s = '"success", but no data from FB.  I am guessing you cancelled the dialog.';
			}
		} else if (e.cancelled) {
			s = "CANCELLED";
		} else {
			s = "FAIL";
			if (e.error) {
				s += "; " + e.error;
			}
		}
		alert(s);
	}
	
	var actionsView = Ti.UI.createScrollView({
		top: 0, left: 0, right: 0,
		visible: fb.loggedIn, height: Ti.UI.SIZE,
		contentHeight:Ti.UI.SIZE, backgroundColor:'white'
	});
	win.add(Ti.UI.createLabel({
		top:70, height:40, text:'Please log into Facebook',
		textAlign:'center'
	}));
	fb.addEventListener('login', function(e) {
		if (e.success) {
			actionsView.show();
		}
		if (e.error) {
			alert(e.error);
		}
	});
	
	fb.addEventListener('logout', function(e){
		Ti.API.info('logout event');
		actionsView.hide();
	});
	
	var blurField = Ti.UI.createButton({
		title:'Done',
		style:Titanium.UI.iPhone.SystemButtonStyle.DONE		
	});
	var statusText = Ti.UI.createTextField({
		top: 0, left: 10, right: 10, height: 40,
		color:'#000', backgroundColor:'#d3d3d3',
		hintText: 'Enter your FB status',
		keyboardToolbar:[
			Titanium.UI.createButton({systemButton:Titanium.UI.iPhone.SystemButton.FLEXIBLE_SPACE}),
			blurField],
	});
	blurField.addEventListener('click',function(e){
		statusText.blur();
	});
	actionsView.add(statusText);
	var statusBtn = Ti.UI.createButton({
		title: 'Publish status with GRAPH API',
		top: 45, left: 10, right: 10, height: 40
	});
	statusBtn.addEventListener('click', function() {
		var text = statusText.value;
		Ti.API.info('text value::'+text+';');
		if( (text === '')){
			Ti.UI.createAlertDialog({ tile:'ERROR', message:'No text to Publish !! '}).show(); 	
		}
		else
		{
			//If publish_actions permission is not granted, request it
			if(fb.permissions.indexOf('publish_actions') < 0) {
				fb.requestNewPublishPermissions(['publish_actions'],fb.AUDIENCE_FRIENDS,function(e){
					if(e.success){
						fb.requestWithGraphPath('me/feed', {message: text}, "POST", showRequestResult);
					} else {
						Ti.API.debug('Failed authorization due to: ' + e.error);
					}
				});
			} else {
				fb.requestWithGraphPath('me/feed', {message: text}, "POST", showRequestResult);
			} 	
		}
		
	});
	actionsView.add(statusBtn);
	
	var wall = Ti.UI.createButton({
		title: 'Publish wall post with GRAPH API',
		top: 90, left: 10, right: 10, height: 40
	});
	wall.addEventListener('click', function() {
		var data = {
			link: "https://developer.mozilla.org/en/JavaScript",
			message: "Use Mozilla's online Javascript reference",
		};
		//If publish_actions permission is not granted, request it
		if(fb.permissions.indexOf('publish_actions') < 0) {
			fb.requestNewPublishPermissions(['publish_actions'],fb.AUDIENCE_FRIENDS,function(e){
				if(e.success){
					fb.requestWithGraphPath('me/feed', data, 'POST', showRequestResult);
				} else {
					Ti.API.debug('Failed authorization due to: ' + e.error);
				}
			});
		} else {
			fb.requestWithGraphPath('me/feed', data, 'POST', showRequestResult);
		}
	});
	actionsView.add(wall);
	
	var wallDialog = Ti.UI.createButton({
		title: 'Share URL with Share Dialog',
		top: 135, left: 10, right: 10, height: 40
	});

	wallDialog.addEventListener('click', function() {		
		fb.presentShareDialog({
			link: 'https://appcelerator.com/',
			title: 'great product',
			description: 'Titanium is a great product',
			picture: 'http://www.appcelerator.com/wp-content/uploads/scale_triangle1.png'
		});
	});
	
	fb.addEventListener('shareCompleted', function(e){
     	if (e.success) {
 			alert('Share completed');
     	}
     	else if (e.cancelled) {
       		alert('Share cancelled');
     	}
     	else {
       		alert('error ' + e.errorDesciption +'. code: ' + e.code );   		
     	}
	});
	actionsView.add(wallDialog);	
	
	var requestDialog = Ti.UI.createButton({
		title: 'Request Dialog',
		top: 180, left: 10, right: 10, height: 40
	});
	
	requestDialog.addEventListener('click', function() {
		fb.presentSendRequestDialog( 
			{message: 'Go to https://appcelerator.com/'}, 
			{data:
	        "{\"badge_of_awesomeness\":\"1\"," +
	        "\"social_karma\":\"5\"}"});
	});

	fb.addEventListener('requestDialogCompleted', function(e) {
		if (e.success) {
			alert('Request dialog completed. Returned data is ' + e.data);
		}
		else if (e.cancelled) {
			alert('Request dialog cancelled');
		}
		else {
			alert('error ' + e.error);           
		}
	});
	
	actionsView.add(requestDialog);	
	win.add(actionsView);

	var likeButton = fb.createLikeButton({
		    top: 230,
		    height: "50%", // Note: on iOS setting Ti.UI.SIZE dimensions prevented the button click
		    width: "50%",
		    objectID: "https://www.facebook.com/appcelerator", // URL or Facebook ID
		    foregroundColor: "white", // A color in Titanium format - see Facebook docs
		    likeViewStyle: 'box_count', // standard, button, box_count - see FB docs
		    auxiliaryViewPosition: 'inline', // bottom, inline, top - see FB docs
		    horizontalAlignment: 'left', // center, left, right - see FB docs,
		    soundEnabled: true // boolean, iOS only
		});
	
	if (Ti.Platform.osname == 'android') {
		likeButton.height = Ti.UI.SIZE;
		likeButton.width = Ti.UI.SIZE;
	} 
	win.add(likeButton);

	return win;
};

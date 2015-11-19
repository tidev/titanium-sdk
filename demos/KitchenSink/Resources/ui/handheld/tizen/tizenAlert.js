//"helper" object. Just to shows message-box (alert-like)
module.exports = {
	// alertTitle - title of aler dialog
	// alertMessage - message shown to the user
	// buttonCaption - caption of single button that closes alert window
	// width - [optional] you can directly specify dialog width. By default 90%
	showAlert: function (alertTitle, alertMessage, buttonCaption, width) {
		var customAlertWindow = Ti.UI.createWindow(),
			dimmingView = Ti.UI.createView({
				backgroundColor: 'black',
				opacity: 0,
				left: 0,
				top: 0,
				right: 0,
				bottom: 0
			}),
			customAlertDialog = Ti.UI.createView({
				width: width || '90%',
				height: Ti.UI.SIZE,
				backgroundColor: 'white',
				borderColor: '#000',
				borderRadius: 5,
				borderWidth: 1,
				layout: Ti.UI._LAYOUT_CONSTRAINING_VERTICAL,
				opacity: 0
			});

		customAlertWindow.add(dimmingView);
		customAlertWindow.add(customAlertDialog);

		// Add the title
		customAlertDialog.add(Ti.UI.createLabel({
			text: alertTitle + '<br/> <hr/>',
			font: { fontWeight: 'bold', fontSize: 24 },
			left: 0,
			right: 0,
			top: 10,
			textAlign: Ti.UI.TEXT_ALIGNMENT_CENTER
		}));
		customAlertDialog.add(Ti.UI.createLabel({
			text: alertMessage + '<br/>',
			left: 5,
			right: 5,
			top: 5,
			textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT
		}));

		// Create buttons
		var button = Ti.UI.createButton({
			left: 5,
			right: 5,
			bottom: 5,
			height: 39,
			title: buttonCaption
		});
		customAlertDialog.add(button);
		button.addEventListener('click', function() { customAlertWindow.close(); customAlertWindow = void 0 });

		// Animate the background after waiting for the first layout to occur
		customAlertDialog.addEventListener('postlayout', function() {
			setTimeout(function(){ // We have to wait for the entire layout pass to complete and the CSS rules to be applied.
				customAlertDialog.animate({
					opacity: 1,
					duration: 0
				});
				dimmingView.animate({
					opacity: 0.5,
					duration: 250
				}, function(){
					customAlertDialog.animate({
						bottom: 0,
						duration: 250
					});
				});
			}, 0);
		});

		// Show the options dialog
		customAlertWindow.open();
	}
};
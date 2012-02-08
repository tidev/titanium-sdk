define("Ti/UI/AlertDialog", ["Ti/_/declare", "Ti/_/Evented"], function(declare, Evented) {

	var undef;

	return declare("Ti.UI.AlertDialog", Evented, {
		show: function() {
			
			// Create the window and a background to dim the current view
			var alertWindow = this._alertWindow = Ti.UI.createWindow();
			var dimmingView = Ti.UI.createView({
				backgroundColor: "black",
				opacity: 0,
				left: 0,
				top: 0,
				right: 0,
				bottom: 0
			});
			alertWindow.add(dimmingView);
			
			// Create the alert dialog itself
			var alertDialog = Ti.UI.createView({
				width: "50%",
				height: "auto",
				backgroundColor: "white",
				layout: "vertical",
				borderRadius: 3,
				opacity: 0
			});
			alertWindow.add(alertDialog);
			
			// Add the title
			alertDialog.add(Ti.UI.createLabel({
				text: this.title,
				font: {fontWeight: "bold"},
				left: 5,
				right: 5,
				top: 5,
				height: "auto",
				textAlign: Ti.UI.TEXT_ALIGNMENT_CENTER
			}));
			
			// Add the message
			alertDialog.add(Ti.UI.createLabel({
				text: this.message,
				left: 5,
				right: 5,
				top: 5,
				height: "auto",
				textAlign: Ti.UI.TEXT_ALIGNMENT_CENTER
			}));
			
			var self = this;
			function addButton(title, index, bottom) {
				var button = Ti.UI.createButton({
					left: 5,
					right: 5,
					top: 5,
					bottom: bottom,
					height: "auto",
					title: title,
					index: index
				});
				if (index === self.cancel) {
					button.domNode.className += " TiUIButtonCancel";
				}
				alertDialog.add(button);
				button.addEventListener("singletap",function(){
					alertWindow.close();
					self._alertWindow = undef;
					self.fireEvent("click",{
						index: index,
						cancel: self.cancel === index
					});
				});
			}
			
			// Add the buttons
			if (require.is(this.buttonNames,"Array")) {
				var buttonNames = this.buttonNames,
					i = 0;
				for (; i < buttonNames.length; i++) {
					addButton(buttonNames[i], i, i === buttonNames.length - 1 ? 5 : 0);
				}
			} else {
				addButton(this.ok, 0, 5);
			}
			
			// Show the alert dialog
			alertWindow.open();
			
			// Animate the background after waiting for the first layout to occur
			setTimeout(function(){
				dimmingView.animate({
					opacity: 0.5,
					duration: 200
				}, function(){
					alertDialog.animate({
						opacity: 1,
						duration: 200
					});
				});
			},30);
		},

		hide: function() {
			if (this._alertWindow) {
				this._alertWindow.close();
			}
		},
		
		properties: {
			
			buttonNames: undef,
			
			cancel: -1,
			
			message: "",
			
			messageid: {
				get: function(value) {
					console.debug('Property "Titanium.UI.AlertDialog#.messageid" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Titanium.UI.AlertDialog#.messageid" is not implemented yet.');
					return value;
				}
			},
			
			ok: "OK",
			
			okid: {
				get: function(value) {
					console.debug('Property "Titanium.UI.AlertDialog#.okid" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Titanium.UI.AlertDialog#.okid" is not implemented yet.');
					return value;
				}
			},
			
			title: "",
			
			titleid: {
				get: function(value) {
					console.debug('Property "Titanium.UI.AlertDialog#.titleid" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Titanium.UI.AlertDialog#.titleid" is not implemented yet.');
					return value;
				}
			}
		}

	});

});

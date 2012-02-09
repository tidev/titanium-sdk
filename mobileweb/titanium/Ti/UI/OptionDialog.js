define(["Ti/_/declare", "Ti/_/Evented", "Ti/UI"], function(declare, Evented, UI) {

	var undef;

	return declare("Ti.UI.OptionDialog", Evented, {
		show: function() {
			
			// Create the window and a background to dim the current view
			var optionsWindow = this._optionsWindow = UI.createWindow();
			var dimmingView = UI.createView({
				backgroundColor: "black",
				opacity: 0,
				left: 0,
				top: 0,
				right: 0,
				bottom: 0
			});
			optionsWindow.add(dimmingView);
			
			// Create the options dialog itself
			var optionsDialog = UI.createView({
				width: "100%",
				height: "auto",
				bottom: 0,
				backgroundColor: "white",
				layout: "vertical",
				opacity: 0
			});
			optionsWindow.add(optionsDialog);
			
			// Add the title
			optionsDialog.add(UI.createLabel({
				text: this.title,
				font: {fontWeight: "bold"},
				left: 5,
				right: 5,
				top: 5,
				height: "auto",
				textAlign: UI.TEXT_ALIGNMENT_CENTER
			}));
			
			var self = this;
			function addButton(title, index, bottom) {
				var button = UI.createButton({
					left: 5,
					right: 5,
					top: 5,
					bottom: bottom,
					height: "auto",
					title: title,
					index: index
				});
				if (index === self.destructive) {
					button.domNode.className += " TiUIButtonDestructive";
				} else if (index === self.cancel) {
					button.domNode.className += " TiUIButtonCancel";
				}
				optionsDialog.add(button);
				button.addEventListener("singletap",function(){
					optionsWindow.close();
					self._optionsWindow = undef;
					self.fireEvent("click",{
						index: index,
						cancel: self.cancel,
						destructive: self.destructive
					});
				});
			}
			
			// Add the buttons
			var options = this.options,
				i = 0;
			if (require.is(options,"Array")) {
				for (; i < options.length; i++) {
					addButton(options[i], i, i === options.length - 1 ? 5 : 0);
				}
			}
			
			// Show the options dialog
			optionsWindow.open();
			
			// Animate the background after waiting for the first layout to occur
			setTimeout(function(){
				optionsDialog.animate({
					bottom: -optionsDialog._measuredHeight,
					opacity: 1,
					duration: 0
				});
				dimmingView.animate({
					opacity: 0.5,
					duration: 150
				}, function(){
					setTimeout(function(){
						optionsDialog.animate({
							bottom: 0,
							duration: 150
						});
					},0);
				});
			},30);
		},
		
		properties: {
			
			cancel: -1,
			
			destructive: -1,
			
			options: undef,
			
			title: "",
			
			titleid: {
				get: function(value) {
					console.debug('Property "Titanium.UI.optionsDialog#.titleid" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Titanium.UI.optionsDialog#.titleid" is not implemented yet.');
					return value;
				}
			}
		}

	});

});

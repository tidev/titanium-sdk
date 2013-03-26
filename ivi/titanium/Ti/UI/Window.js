define(["Ti/_/declare", "Ti/Gesture", "Ti/Locale", "Ti/_/UI/SuperView", "Ti/UI"],
	function(declare, Gesture, Locale, SuperView, UI) {

	var UI_FILL = UI.FILL,
		UI_SIZE = UI.SIZE,
		postNavGroup = {
			post: function () {
				this._navGroup && this._navGroup._updateNavBar();
			}
		};

	return declare("Ti.UI.Window", SuperView, {
	
		_defaultWidth: UI_FILL,

		_defaultHeight: UI_FILL,

		postscript: function() {
			if (this.url) {
				var prevWindow = UI.currentWindow;
				UI._setWindow(this);
				require("Ti/_/include!sandbox!" + this.url);
				UI._setWindow(prevWindow);
			}
		},

		_getTitle: function() {
			return Locale.getString(this.titleid, this.title);
		},

		constants: {
			url: void 0,
			bubbleParent: false
		},

		properties: {
		
			modal: {
				set: function(value, oldValue) {
					if (value !== oldValue) {
						if (value) {
							var parentContainer = this._modalParentContainer = UI.createView();
							parentContainer._add(UI.createView({
								backgroundColor: "#000",
								opacity: 0.5
							}));
							parentContainer._add(this._modalContentContainer = UI.createView({
								width: UI_SIZE,
								height: UI_SIZE
							}));
							this._modalContentContainer.add(this); // We call the normal .add() method to hook into the views proper add mechanism
						} else if (this._modalParentContainer) {
							this._modalParentContainer._opened && this._modalParentContainer.close();
							this._modalContentContainer.remove(this);
							this._modalParentContainer = null;
							if (this._opened) {
								this.close(); // Close to reset state...at this point it's not attached to the window anymore, but thinks it's still open
								this.open();
							}
						}
					}
					return value;
				}
			},

			orientation: {
				get: function() {
					return Gesture.orientation;
				}
			},
		
			/** Nav group properties **/
			
			barColor: postNavGroup,
			
			barImage: postNavGroup,
			
			leftNavButton: postNavGroup,
			
			navBarHidden: postNavGroup,
			
			rightNavButton: postNavGroup,
			
			titleControl: postNavGroup,
			
			titleImage: postNavGroup,

			title: postNavGroup,

			titleid: postNavGroup,
			
			translucent: postNavGroup
		}

	});

});
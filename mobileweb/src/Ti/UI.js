define("Ti/UI", ["Ti/_/dom", "Ti/_/Evented", "Ti/_/lang", "Ti/_/style"], function(dom, Evented, lang, style) {
	
	var undef,
		isDef = require.isDef;

	return lang.setObject("Ti.UI", Evented, {
		
		_addWindow: function(win) {
			this._validateContainer();
			this._container.add(win);
		},
		
		_removeWindow: function(win) {
			this._validateContainer();
			this._container.remove(win);
		},
		
		_doFullLayout: function() {
			if (!this._layoutInProgress) {
				this._layoutInProgress = true;
				setTimeout(lang.hitch(this, function(){
					this._validateContainer();
					this._container.doLayout(0,0,document.body.clientWidth,document.body.clientHeight,true,true);
					this._layoutInProgress = false;
				}),25);
			}
		},
		
		_handleClickEvent: function(x, y, type) {
			
			// Get the event bubble
			var controlList = [];
			this._calculateMouseEventBubble(x,y,this._container,controlList);
			
			// Call the event handlers
			for (var i = controlList.length - 1; i >= 0; i--) {
				controlList[i].fireEvent(type, {
					x: x,
					y: y
				});
			}
		},
		
		_calculateMouseEventBubble: function(x, y, currentControl, controlList) {
			
			// Check if this control intersects with the coordinates
			if (currentControl.touchEnabled && 
				currentControl._measuredLeft <= x && currentControl._measuredLeft + currentControl._measuredWidth >= x && 
				currentControl._measuredTop <= y && currentControl._measuredTop + currentControl._measuredHeight >= y) {
					
				// Add the control to the list
				controlList.push(currentControl);
			
				// Check if any of the controls children intersets with the coordinates
				var children = currentControl.children;
				if (children && children.length > 0) {
					var frontChildControl = children[0];
					var frontZIndex = isDef(frontChildControl.zIndex) ? frontChildControl.zIndex : 0;
					for (var i = 1; i < children.length; i++) {
						var currentZIndex = isDef(children[i].zIndex) ? children[i].zIndex : 0;
						if (currentZIndex >= frontZIndex && children[i].touchEnabled) {
							frontChildControl = children[i];
							frontZIndex = currentZIndex;
						}
					}
					this._calculateMouseEventBubble(x,y,frontChildControl,controlList);
				}
			}
		},
		
		_validateContainer: function() {
			if (!isDef(this._container)) {
				this._layoutInProgress = false;
				this._container = Ti.UI.createView();
				this._container.left = 0;
				this._container.top = 0;
				document.body.appendChild(this._container.domNode);
				
				document.addEventListener("click", lang.hitch(this, function(e){
					this._handleClickEvent(e.clientX, e.clientY, "click");
				}));
					
				document.addEventListener("dblclick", lang.hitch(this, function(e){
					this._handleClickEvent(e.clientX, e.clientY, "dblclick");
				}));
			}
		},
		
		properties: {
			backgroundColor: {
				set: function(value) {
					return style.set(document.body, "backgroundColor", value);
				}
			},
			backgroundImage: {
				set: function(value) {
					return style.set(document.body, "backgroundImage", value ? style.url(value) : "");
				}
			}
		},

		constants: {
			UNKNOWN: 0,
			FACE_DOWN: 1,
			FACE_UP: 2,
			PORTRAIT: 3,
			UPSIDE_PORTRAIT: 4,
			LANDSCAPE_LEFT: 5,
			LANDSCAPE_RIGHT: 6,
			INPUT_BORDERSTYLE_BEZEL: 3,
			INPUT_BORDERSTYLE_LINE: 1,
			INPUT_BORDERSTYLE_NONE: 0,
			INPUT_BORDERSTYLE_ROUNDED: 2,
			INPUT_BUTTONMODE_ALWAYS: 1,
			INPUT_BUTTONMODE_NEVER: 0,
			INPUT_BUTTONMODE_ONBLUR: 0,
			INPUT_BUTTONMODE_ONFOCUS: 1,
			KEYBOARD_APPEARANCE_ALERT: 1,
			KEYBOARD_APPEARANCE_DEFAULT: 0,
			KEYBOARD_ASCII: 1,
			KEYBOARD_DEFAULT: 2,
			KEYBOARD_EMAIL: 3,
			KEYBOARD_NAMEPHONE_PAD: 4,
			KEYBOARD_NUMBERS_PUNCTUATION: 5,
			KEYBOARD_NUMBER_PAD: 6,
			KEYBOARD_PHONE_PAD: 7,
			KEYBOARD_URL: 8,
			NOTIFICATION_DURATION_LONG: 1,
			NOTIFICATION_DURATION_SHORT: 2,
			PICKER_TYPE_COUNT_DOWN_TIMER: 1,
			PICKER_TYPE_DATE: 2,
			PICKER_TYPE_DATE_AND_TIME: 3,
			PICKER_TYPE_PLAIN: 4,
			PICKER_TYPE_TIME: 5,
			RETURNKEY_DEFAULT: 0,
			RETURNKEY_DONE: 1,
			RETURNKEY_EMERGENCY_CALL: 2,
			RETURNKEY_GO: 3,
			RETURNKEY_GOOGLE: 4,
			RETURNKEY_JOIN: 5,
			RETURNKEY_NEXT: 6,
			RETURNKEY_ROUTE: 7,
			RETURNKEY_SEARCH: 8,
			RETURNKEY_SEND: 9,
			RETURNKEY_YAHOO: 10,
			TEXT_ALIGNMENT_CENTER: 1,
			TEXT_ALIGNMENT_RIGHT: 2,
			TEXT_ALIGNMENT_LEFT: 3,
			TEXT_AUTOCAPITALIZATION_ALL: 3,
			TEXT_AUTOCAPITALIZATION_NONE: 0,
			TEXT_AUTOCAPITALIZATION_SENTENCES: 2,
			TEXT_AUTOCAPITALIZATION_WORDS: 1,
			TEXT_VERTICAL_ALIGNMENT_BOTTOM: 2,
			TEXT_VERTICAL_ALIGNMENT_CENTER: 1,
			TEXT_VERTICAL_ALIGNMENT_TOP: 3
		},

		create2DMatrix: function(args) {
			return new Ti.UI["2DMatrix"](args);
		},

		createActivityIndicator: function(args) {
			return new Ti.UI.ActivityIndicator(args);
		},

		createAlertDialog: function(args) {
			return new Ti.UI.AlertDialog(args);
		},

		createAnimation: function(args) {
			return new Ti.UI.Animation(args);
		},

		createButton: function(args) {
			return new Ti.UI.Button(args);
		},

		createButtonBar: function() {
			console.debug('Method "Titanium.UI.createButtonBar" is not implemented yet.');
		},

		createDashboardItem: function() {
			console.debug('Method "Titanium.UI.createDashboardItem" is not implemented yet.');
		},

		createDashboardView: function() {
			console.debug('Method "Titanium.UI.createDashboardView" is not implemented yet.');
		},

		createEmailDialog: function() {
			console.debug('Method "Titanium.UI.createEmailDialog" is not implemented yet.');
		},

		createImageView: function(args) {
			return new Ti.UI.ImageView(args);
		},

		createLabel: function(args) {
			return new Ti.UI.Label(args);
		},

		createOptionDialog: function() {
			console.debug('Method "Titanium.UI.createOptionDialog" is not implemented yet.');
		},

		createPicker: function(args) {
			return new Ti.UI.Picker(args);
		},

		createPickerColumn: function() {
			console.debug('Method "Titanium.UI.createPickerColumn" is not implemented yet.');
		},

		createPickerRow: function(args) {
			return new Ti.UI.PickerRow(args);
		},

		createProgressBar: function() {
			console.debug('Method "Titanium.UI.createProgressBar" is not implemented yet.');
		},

		createScrollView: function(args) {
			return new Ti.UI.ScrollView(args);
		},

		createScrollableView: function(args) {
			return new Ti.UI.ScrollableView(args);
		},

		createSearchBar: function(args) {
			return new Ti.UI.SearchBar(args);
		},

		createSlider: function(args) {
			return new Ti.UI.Slider(args);
		},

		createSwitch: function(args) {
			return new Ti.UI.Switch(args);
		},

		createTab: function(args) {
			return new Ti.UI.Tab(args);
		},

		createTabGroup: function(args) {
			return new Ti.UI.TabGroup(args);
		},

		createTableView: function(args) {
			return new Ti.UI.TableView(args);
		},

		createTableViewRow: function(args) {
			return new Ti.UI.TableViewRow(args);
		},

		createTableViewSection: function(args) {
			return new Ti.UI.TableViewSection(args);
		},

		createTextArea: function(args) {
			return new Ti.UI.TextArea(args);
		},

		createTextField: function(args) {
			return new Ti.UI.TextField(args);
		},

		createView: function(args) {
			return new Ti.UI.View(args);
		},

		createWebView: function(args) {
			return new Ti.UI.WebView(args);
		},

		createWindow: function(args) {
			return new Ti.UI.Window(args);
		}

	});

});
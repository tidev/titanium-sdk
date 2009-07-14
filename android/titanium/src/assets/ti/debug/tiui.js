/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

Titanium.uiProxy = window.TitaniumUI;

var MenuItem = function() {
	this.obj; // reference to Java object
	this._callback;

	/**
	 * @tiapi(method=true,name=UI.MenuItem.isRoot,since=0.4) Determines if this menu item is the root item
	 * @tiresult[boolean] true, if the menuitem is the root menuitem; otherwise, false.
	 */
	this.isRoot = function() {
		return this.obj.isRoot();
	};
	/**
	 * @tiapi(method=true,name=UI.MenuItem.isSeparator,since=0.4) Determine if this menu item is a separator
	 * @tiapi Android doesn't have the concept of a separator, so these items are ignored.
	 * @tiresult[boolean] true, if a menu separator; otherwise, false.
	 */
	this.isSeparator = function() {
		return this.obj.isSeparator(); // Valid data, but ignored by Android
	};
	/**
	 * @tiapi(method=true,name=UI.MenuItem.isItem,since=0.4) Determine if this menu item is a menu item
	 * @tiresult[boolean] true, if a menu item; otherwise, false.
	 */
	this.isItem = function() {
		return this.obj.isItem();
	};
	/**
	 * @tiapi(method=true,name=UI.MenuItem.isSubMenu,since=0.4) Determin if this menu item represents a sub-menu
	 * @tiresult[boolean] true, if a sub-menu; otherwise, false.
	 */
	this.isSubMenu = function() {
		return this.obj.isSubMenu();
	};
	/**
	 * @tiapi(method=true,name=UI.MenuItem.isEnabled,since=0.4) Determine enabled state of menu item.
	 * @tiresult[boolean] true, if the menu item is enabled; otherwise, false.
	 */
	this.isEnabled = function() {
		return this.obj.isEnabled();
	};
	/**
	 * @tiapi(method=true,name=UI.MenuItem.addSeparator,since=0.4) Add a separator to a menu
	 * @tiresult[MenuItem] the separator menu item.
	 */
	this.addSeparator = function() {
		var m = new MenuItem;
		m.obj = this.obj.addSeparator();
		return m;
	};
	/**
	 * @tiapi(method=true,name=UI.MenuItem.addItem,since=0.4) Add a menu item
	 * @tiarg[string,label] Menu item label
	 * @tiarg[function,callback] Function to invoke when menu item is selected
	 * @tiarg[string,icon] Path to icon.
	 * @tiresult[MenuItem] the new menu item.
	 */
	this.addItem = function(label, callback, icon) {
		var m = new MenuItem();
		this._callback = callback;
		m.obj = this.obj.addItem(label, registerCallback(this, this._callback), icon);
		return m;
	};
	/**
	 * @tiapi(method=true,name=UI.MenuItem.addSubMenu,since=0.4) Add a sub menu
	 * @tiarg[string,label] Sub menu label
	 * @tiarg[string,icon] Path to icon
	 * @tiresult[MenuItem] The sub menu item.
	 */
	this.addSubMenu = function(label, icon) {
		var m = new MenuItem();
		m.obj = this.obj.addSubMenu(label, icon);
		return m;
	};
	/**
	 * @tiapi(method=true,name=UI.MenuItem.enable,since=0.4) enable a menu item
	 */
	this.enable = function() {
		this.obj.enable();
	};
	/**
	 * @tiapi(method=true,name=UI.MenuItem.disable,since=0.4) disable a menu item
	 */
	this.disable = function() {
		this.obj.disable();
	};
	/**
	 * @tiapi(method=true,name=UI.MenuItem.setLabel,since=0.4) Set the label on this menu item.
	 * @tiarg[string,label] the new label
	 */
	this.setLabel = function(label) {
		this.obj.setLabel(label);
	};
	/**
	 * @tiapi(method=true,name=UI.MenuItem.getLabel,since=0.4) Get the current label
	 * @tiresult[string, label] The label
	 */
	this.getLabel = function() {
		return this.obj.getLabel();
	};
	/**
	 * @tiapi(method=true,name=UI.MenuItem.setIcon,since=0.4) Set a new icon for the menu item
	 * @tiarg[string,path] Path to new icon
	 */
	this.setIcon = function(icon) {
		this.obj.setIcon(icon);
	};
	/**
	 * @tiapi(method=true,name=UI.MenuItem.getIcon,since=0.4) Get the current icon path
	 * @tiresult[string,path] Path to current icon.
	 */
	this.getIcon = function() {
		return this.obj.getIcon();
	};
	this.setCallback = function(f) {
		_callback = f;
		this.obj.setCallback(registerCallback(this, f));
	};
};

var OptionDialog = function(proxy) {
	this.proxy = proxy;

	/**
	 * @tiapi(method=true,name=UI.OptionDialog.setTitle,since=0.4) Set the title
	 * @tiarg[string,title] The title to set on the dialog
	 */
	this.setTitle = function(title) {
		this.proxy.setTitle(title);
	};
	/**
	 * @tiapi(method=true,name=UI.OptionDialog.setOptions,since=0.4) Set the list of options
	 * @tiarg[string array,options] an array of string values to display
	 */
	this.setOptions = function(options) {
		var o = transformObjectValue(options, []);
		if (typeOf(o) !== 'array') {
			o = [ options ];
		}
		this.proxy.setOptions(o);
	};
	/**
	 * @tiapi(method=true,name=UI.OptionDialog.addEventListener,since=0.4) Add a listener. Currently supports 'click'
	 * @tiarg[string,eventName] Name of event.
	 * @tiarg[function,listener] Function to handle the event callback
	 * @tiresult[int] id used to remove the added listener
	 */
	this.addEventListener = function(eventName, listener) {
		if (eventName !== "click") {
			throw new Error("OptionDialog only handles click events. Use event name 'click'");
		}

		return this.proxy.addEventListener(eventName, registerCallback(this, listener));
	};
	/**
	 * @tiapi(method=true,name=UI.OptionDialog.removeEventListener,since=0.5) Remove listener added for the 'click' event.
	 * @tiarg[string,eventName] name of the event to listen for.
	 * @tiarg[int,listenerId] id returned by addEventListener
	 */
	this.removeEventListener = function(eventName, listenerId) {
		if (eventName !== "click") {
			throw new Error("OptionDialog only handles click events. Use event name 'click'");
		}

		this.proxy.removeEventListener(eventName, listenerId);
	};
	/**
	 * @tiapi(method=true,name=UI.OptionDialog.show,since=0.4) Show this dialog.
	 */
	this.show = function() {
		this.proxy.show();
	};
	// Noop, iPhone only methods
	this.setDestructive = function(id) {

	};
	this.setCancel = function(id) {

	}
};

var AlertDialog = function(proxy) {
	this.proxy = proxy;

	/**
	 * @tiapi(method=true,name=UI.AlertDialog.setTitle,since=0.4) Set the title
	 * @tiarg[string,title] title for dialog
	 */
	this.setTitle = function(title) {
		this.proxy.setTitle(title);
	};
	/**
	 * @tiapi(method=true,name=UI.AlertDialog.setMessage,since=0.4) Set the dialog message
	 * @tiarg[string,message] message to display in the dialog
	 */
	this.setMessage = function(msg) {
		alert("setting msg: " + msg);
		this.proxy.setMessage(msg);
	};
	/**
	 * @tiapi(method=true,name=UI.AlertDialog.setButtonNames,since=0.4) Text to display on each button
	 * @tiarg[string array,names] One to three names to apply to buttons. Android only supports up to 3 buttons.
	 */
	this.setButtonNames = function(names) {
		var n = transformObjectValue(names, []);
		if (typeOf(n) !== 'array') {
			n = [ names ];
		}
		this.proxy.setButtons(n);
	};
	/**
	 * @tiapi(method=true,name=UI.AlertDialog.addEventListener,since=0.4) Add a listener for the 'click' event.
	 * @tiarg[string,eventName] name of the event to listen for
	 * @tiarg[function,listener] function to call when button is clicked.
	 * @tiresult[int] id used to remove the added listener
	 */
	this.addEventListener = function(eventName, listener) {
		if (eventName !== "click") {
			throw new Error("AlertDialog only handles click events. Use event name 'click'");
		}

		return this.proxy.addEventListener(eventName, registerCallback(this, listener));
	};
	/**
	 * @tiapi(method=true,name=UI.AlertDialog.removeEventListener,since=0.5) Remove listener added for the 'click' event.
	 * @tiarg[string,eventName] name of the event to listen for.
	 * @tiarg[int,listenerId] id returned by addEventListener
	 */
	this.removeEventListener = function(eventName, listenerId) {
		if (eventName !== "click") {
			throw new Error("AlertDialog only handles click events. Use event name 'click'");
		}

		this.proxy.removeEventListener(eventName, listenerId);
	};
	/**
	 * @tiapi(method=true,name=UI.AlertDialog.show,since=0.4) Show the alert dialog
	 */
	this.show = function() {
		this.proxy.show();
	}
};

var ActivityIndicator = function(proxy) {
	this.proxy = proxy;

	/**
	 * @tiapi(method=true,name=UI.ActivityIndicator.setMessage,since=0.4) Message to display
	 * @tiarg[string,msg] The message
	 */
	this.setMessage = function(msg) {
		this.proxy.setMessage(msg);
	};
	/**
	 * @tiapi(method=true,name=UI.ActivityIndicator.setMin,since=0.4) Set minimum value to accept on determinant indicators.
	 * @tiarg[int,n] the minimum value
	 */
	this.setMin = function(n) {
		this.proxy.setMin(n);
	};
	/**
	 * @tiapi(method=true,name=UI.ActivityIndicator.setMax,since=0.4) Set maximum value to accept on determinant indicators.
	 * @tiarg[int,n] the maximum value
	 */
	this.setMax = function(n) {
		this.proxy.setMax(n);
	};
	/**
	 * @tiapi(method=true,name=UI.ActivityIndicator.setPos,since=0.4) Set the current indicator position between min and max
	 * @tiarg[int,n] the position
	 */
	this.setPos = function(n) {
		this.proxy.setPosition(n);
	};
	/**
	 * @tiapi(method=true,name=UI.ActivityIndicator.show,since=0.4) Show the indicator
	 */
	this.show = function() {
		this.proxy.show();
	};
	/**
	 * @tiapi(method=true,name=UI.ActivityIndicator.hide,since=0.4) Hide the indicator
	 */
	this.hide = function() {
		this.proxy.hide();
	};
	// See below for setLocation
};

var TitaniumNotifier = function(proxy) {
	this.proxy = proxy; // reference to Java object
	this._callback; //

	/**
	 * @tiapi(method=true,name=UI.Notifier.setTitle,since=0.4) Set the title for a notification
	 * @tiapi Android currently uses Toast, so title is not displayed.
	 * @tiarg[string,title] The title
	 */
	this.setTitle = function(title) {
		this.proxy.setTitle(title);
	};
	/**
	 * @tiapi(method=true,name=UI.Notifier.setMessage,since=0.4) Set the message
	 * @tiarg[string,message] The message
	 */
	this.setMessage = function(message) {
		this.proxy.setMessage(message);
	};
	/**
	 * @tiapi(method=true,name=UI.Notifier.setIcon,since=0.4) Set an icon for the notification
	 * @tiapi Android currently uses Toast, icon will not display.
	 * @tiarg[string,iconUrl] The path to the icon
	 */
	this.setIcon = function(iconUrl) {
		this.proxy.setIcon(iconUrl);
	};
	/**
	 * @tiapi(method=true,name=UI.Notifier.setDelay,since=0.4) Set how long notification is displayed.
	 * @tiapi Android uses one or greater for long delay, zero for short delay
	 * @tiarg[int,delay] Period to delay.
	 */
	this.setDelay = function(delay) {
		this.proxy.setDelay(delay);
	};
	this.setCallback = function(callback) {
		this._callback = callback;
		this.proxy.setCallback(registerCallback(this, _callback));
	};
	/**
	 * @tiapi(method=true,name=UI.Notifier.show,since=0.4) Show the notifier
	 * @tiarg[boolean,animate] currently ignored on android
	 * @tiarg[boolean,autohide] currently ignored on android
	 */
	this.show = function(animate, autohide) {

		this.proxy.show(transformObjectValue(animate, false),
				transformObjectValue(autohide, true));
	};
	/**
	 * @tiapi(method=true,name=UI.Notifier.hide,since=0.4) Hide the notifier
	 * @tiarg[boolean,animate] ignored on Android
	 */
	this.hide = function(animate) {
		this.proxy.hide(transformObjectValue(animate, false));
	}
};

var TableView = function(proxy) {
	this.proxy = proxy; // reference to Java object
	this._callback;

	/**
	 * @tiapi(method=true,name=UI.TableView.setData,since=0.5) set options data describing view
	 * @tiarg[string,data] options data
	 */
	this.setData = function(data) {
		this.proxy.setData(data);
	};
	/**
	 * @tiapi(method=true,name=UI.TableView.setRowHeight,since=0.5) set the height of each row
	 * @tiarg[string,rowHeight] height of row
	 */
	this.setRowHeight = function(height) {
		this.proxy.setRowHeight(height);
	};
	this.setIsPrimary = function(primary) {
		this.proxy.setIsRoot(primary);
	};
	/**
	 * @tiapi(method=true,name=UI.TableView.open,since=0.5) open the table view
	 * @tiarg[string, options] open options
	 */
	this.open = function(options) {
		var opt = null;
		if (!isUndefined(options)) {
			opt = Titanium.JSON.stringify(options);
		}
		this.proxy.open(opt, registerCallback(this, this._callback));
	};
	/**
	 * @tiapi(method=true,name=UI.TableView.close,since=0.5) close an open table view
	 */
	this.close = function() {
		this.proxy.close();
	}
};

var UserWindow = function(proxy) {
	this.proxy = proxy; // reference to java object
	this._window; // the DOM window

	this.setWindowId = function(name) { //TODO: Is this to be exposed or not? -blain
		this.proxy.setWindowId(name);
	}
	/**
	 * @tiapi(method=true,name=UI.UserWindow.setURL,since=0.4) Sets the url for the window
	 * @tiarg[string,url] url to HTML file.
	 */
	this.setURL = function(url) {
		this.proxy.setUrl(url);
	};
	/**
	 * @tiapi(method=true,name=UI.UserWindow.setTitle,since=0.4) Sets the window title
	 * @tiarg[string,title] The title for the window
	 */
	this.setTitle = function(title) {
		this.proxy.setTitle(title);
	};
	/**
	 * @tiapi(method=true,name=UI.UserWindow.setTitleImage,since=0.4) Set an image in the title area
	 * @tiarg[string,imageUrl] url to image
	 */
	this.setTitleImage = function(imageUrl) {
		this.proxy.setTitleImage(imageUrl);
	};
	/**
	 * @tiapi(method=true,name=UI.UserWindow.setFullscreen,since=0.4) Set the window to take over the full screen
	 * @tiapi In the beta release of Android this method cannot override the state set in tiapp.xml
	 * @tiarg[boolean,fullscreen] true, if the image should be fullscreen; otherwise, false.
	 */
	this.setFullscreen = function(fullscreen) {
		this.proxy.setFullscreen(fullscreen);
	};
	/**
	 * @tiapi(method=true,name=UI.UserWindow.setType,since=0.4) Set type of window. Current types are 'single' and 'tabbed'
	 * @tiapi tabbed windows should not be used except for the initial view.
	 * @tiarg[string,type] WINDOW_NORMAL or WINDOW_TABBED
	 */
	this.setType = function(type) {
		this.proxy.setType(type);
	}
	/**
	 * @tiapi(method=true,name=UI.UserWindow,since=0.4) open the window
	 * @tiarg[hash,options,optional=true] Options used to configure window before opening.
	 */
	this.open = function(options) {
		this._window = this.proxy.open(); // Handle options later
		// append to windows
		return this._window;
	};
	/**
	 * @tiapi(method=true,name=UI.UserWindow.close,since=0.4) close this window
	 * @tiarg[hash,options,optional=true] Ignored on Android in the beta.
	 */
	this.close = function(options) {
		this.proxy.close();
		// Remove from windows
		this._window = null;
	};
	/**
	 * @tiapi(method=true,name=UI.UserWindow.addEventListener,since=0.4) Add a listener for to this window. Support 'focused' and 'unfocused'
	 * @tiarg[string,eventName] The event name
	 * @tiarg[function,listener] The event listener
	 * @tiresult[int] id used when removing the listener
	 */
	this.addEventListener = function(eventName, listener) {
		return this.proxy.addEventListener(eventName, registerCallback(this, listener));
	};
	/**
	 * @tiapi(method=true,name=UI.UserWindow.removeEventListener,since=0.4) Remove a previously added listener
	 * @tiarg[string,eventName] The event name
	 * @tiarg[int,listenerId] id returned from addEventListener
	 */
	this.removeEventListener = function(eventName, listenerId) {
		this.proxy.removeEventListener(eventName, listenerId);
	};
	// IPhone only methods
	this.setNavBarColor = function (color) {

	};
	this.setLeftNavButton = function(button) {

	};
	this.setRightNavButton = function(button) {

	};
	this.showNavBar = function(options) {

	};
	this.hideNavBar = function(options) {

	}
	this.setBarColor = function(options) {

	}
};

UserWindow.prototype.__defineGetter__("window", function() {
	return this._window;
});
//TODO doc
var Button = function(proxy) {
	this.proxy = proxy;

	this.addEventListener = function(eventName, listener) {
		return this.proxy.addEventListener(eventName, registerCallback(this, listener));
	};
	this.removeEventListener = function(eventname, listenerId) {
		this.proxy.removeEventListener(eventName, listenerId);
	};
	this.open = function(options) {
		this.proxy.open(options);
	};
};

Titanium.UI = {
	/**
	 * @tiapi(property=true,name=UI.WINDOW_TABBED,since=0.4) Used in UserWindow.setType for a tabbed window
	 * @tiapi Android currently does not support tabbed windows except as the root/initial window.
	 */
	WINDOW_TABBED : 'tabbed',
	/**
	 * @tiapi(property=true,name=UI.WINDOW_NORMAL,since=0.4) Used in UserWindow.setType for a single window
	 */
	WINDOW_NORMAL : 'single',
	/**
	 * @tiapi(method=true,name=UI.createWindow,since=0.4) Create a new window
	 * @tiarg[hash,options,optional=true] Options for configuring window
	 * @tiresult[UserWindow] the new window
	 */
	createWindow : function(options) {
		var w = new UserWindow(Titanium.uiProxy.createWindow());
		if (!isUndefined(options)) {
			var url = options['url'];
			var fullscreen = options['fullscreen'];
			var type = options['type'];
			var title = options['title'];
			var titleImage = options['titleImage'];

			if (!isUndefined(url)) {
				w.setURL(url);
			}
			if (!isUndefined(fullscreen)) {
				w.setFullscreen(fullscreen);
			}
			if (!isUndefined(type)) {
				w.setType(type);
			}
			if (!isUndefined(title)) {
				w.setTitle(title);
			}
			if (!isUndefined(titleImage)) {
				w.setTitleImage(titleImage);
			}
		}

		return w;
	},
	/**
	 * @tiapi(method=true,name=UI.createMenu,since=0.4) Create a new root menu item
	 * @tiresult[MenuItem] the new root menu item
	 */
	createMenu : function() {
		var m = new MenuItem;
		m.obj = Titanium.uiProxy.createMenu(); // Consider a hash of menus
		return m;
	},
	createTrayMenu : function() {
		//TODO implement UI.createTrayMenu
	},
	/**
	 * @tiapi(method=true,name=UI.setMenu,since=0.4) Associate a menu with the current window
	 * @tiarg[MenuItem,m] A root menu item
	 */
	setMenu : function(m) {
		Titanium.uiProxy.setMenu(m.obj);
	},
	getMenu : function() {
		Titanium.uiProxy.getMenu(); //Not sure what this should/will do
	},
	setContextMenu : function() {
		//TODO implement UI.setContextMenu
	},
	getContextMenu : function() {
		//TODO implement UI.getContextMenu
	},
	setIcon : function() {
		//TODO implement UI.setIcon
	},
	windows : function() {
		//TODO implement UI.windows as value
	},
	/**
	 * @tiapi(method=true,name=UI.createAlertDialog,since=0.4) Create an alert dialog
	 * @tiarg[hash,options,optional=true] options for configuring alert dialog
	 * @tiresult[AlertDialog] the dialog.
	 */
	createAlertDialog : function(options) {
		var dlg = new AlertDialog(Titanium.uiProxy.createAlertDialog());

		if (! isUndefined(options)) {
			title = options['title'];
			message = options['message'];
			buttonNames = options['buttonNames'];

			if (!isUndefined(title)) {
				dlg.setTitle(title);
			}
			if (!isUndefined(message)) {
				dlg.setMessage(message);
			}
			if (!isUndefined(buttonNames)) {
				dlg.setButtonNames(buttonNames);
			}
		}

		return dlg;
	},
	/**
	 * @tiapi(method=true,name=UI.createOptionDialog,since=0.4) Create an option dialog
	 * @tiarg[hash,options,optional=true] options for configuring option dialog
	 * @tiresult[OptionDialog] the dialog.
	 */
	createOptionDialog : function(options) {
		var dlg = new OptionDialog(Titanium.uiProxy.createOptionDialog());

		if (! isUndefined(options)) {
			title = options['title'];
			optionValues = options['options'];

			if (!isUndefined(title)) {
				dlg.setTitle(title);
			}
			if (!isUndefined(buttonNames)) {
				dlg.setOptions(optionValues);
			}
		}

		return dlg;
	},
	/**
	 * @tiapi(method=true,name=UI.createActivityIndicator,since=0.4) Create an activity indicator
	 * @tiarg[hash,options,optional=true] options for configuring the activiy indicator
	 * @tiresult[ActivityIndicator] the dialog.
	 */
	createActivityIndicator : function(options) {
		var ind = new ActivityIndicator(Titanium.uiProxy.createProgressDialog());

		if (!isUndefined(options)) {
			var message = options['message'];
			var loc = options['location'];
			var type = options['type'];
			var minVal = options['min'];
			var maxVal = options['max'];
			var position = options['pos'];

			if (!isUndefined(message)) {
				ind.setMessage(message);
			}
			if (!isUndefined(loc)) {
				ind.setLocation(loc);
			}
			if (!isUndefined(type)) {
				ind.setType(type);
			}
			if (!isUndefined(minVal)) {
				ind.setMin(minVal);
			}
			if (!isUndefined(maxVal)) {
				ind.setMax(maxVal);
			}
			if (!isUndefined(position)) {
				ind.setPos(position);
			}
		}
		return ind;
	},
	/**
	 * @tiapi(method=true,name=UI.createTableView,since=0.5) Create a table view
	 * @tiarg[object, options] a dictionary/hash of options
	 * @tiresult[TableView] the table view.
	 */
	createTableView : function(options, callback) {
		 var tv = new TableView(Titanium.uiProxy.createTableView());

		 tv._callback = callback;

		 if(!isUndefined(options)) {
			 var data = options['data'];
			 var rowHeight = options['rowHeight'];
			 var isPrimary = options['isPrimary'];

			 if (!isUndefined(data)) {
				 tv.setData(Titanium.JSON.stringify(data));
			 }
			 if (!isUndefined(rowHeight)) {
				 tv.setRowHeight(rowHeight);
			 }
			 if (!isUndefined(isPrimary)) {
				 tv.setIsPrimary(isPrimary);
			 }
		 }

		 return tv;
	},
	/**
	 * @tiapi(method=true,name=UI.createButton,since=0.5.1) Create a native button
	 * @tiarg[object, options] a set of configuration options for the button
	 * @tiresult[Button] the button.
	 */
	createButton : function(options) {
		return new Button(Titanium.uiProxy.createButton(Titanium.JSON.stringify(options)));
	},

	// createNotification is below. It needs the property currentWindow
	// iPhone only methods
	createToolbar : function(options) {
		return null;
	},
	setTabBadge : function(id) {
		// do nothing
	},
	setStatusBarColor : function(color) {
		// do nothing
	}
};
Titanium.UI.createAlert = Titanium.UI.createAlertDialog; //TODO remove

/**
 * @tiapi(method=true,name=UI.currentWindow,since=0.4) the current UserWindow
 * @tiresult[UserWindow] this window.
 */
Titanium.UI._currentWindow = null;
Titanium.UI.__defineGetter__("currentWindow", function(){
	// Can't set this from the native side, so set on first access
	if (Titanium.UI._currentWindow == null) {
		Titanium.UI._currentWindow = new UserWindow(Titanium.uiProxy.getCurrentWindow());
	}
	return Titanium.UI._currentWindow;
});

Titanium.UI.ActivityIndicator = {
	/**
	 * @tiapi(property=true,name=UI.ActivityIndicator.STATUS_BAR,since=0.4) Display activity indicator in status bar
	 */
	STATUS_BAR : 0,
	/**
	 * @tiapi(property=true,name=UI.ActivityIndicator.DIALOG,since=0.4) Display activity indicator as a dialog
	 */
	DIALOG : 1,
	/**
	 * @tiapi(property=true,name=UI.ActivityIndicator.INDETERMINANT,since=0.4) Show activity as indeterminant
	 */
	INDETERMINANT : 0,
	/**
	 * @tiapi(property=true,name=UI.ActivityIndicator.DETERMINANT,since=0.4) Show activity as determinant
	 */
	DETERMINANT : 1
};

Titanium.UI.Android = {

};

Titanium.UI.Android.SystemIcon = {
	ACTION : 'ti:Ti:default_icon',
	CAMERA : 'ti:Sys:ic_menu_camera',
	COMPOSE: 'ti:Sys:ic_menu_compose',
	BOOKMARKS : 'ti:Ti:default_icon',
	SEARCH : 'ti:Sys:ic_menu_search',
	ADD : 'ti:Sys:ic_menu_add',
	TRASH : 'ti:Sys:ic_menu_delete',
	ORGANIZE : 'ti:Sys:ic_menu_archive',
	REPLY : 'ti:Ti:default_icon',
	STOP : 'ti:Sys:ic_menu_stop',
	REFRESH : 'ti:Sys:ic_menu_refresh',
	PLAY : 'ti:Sys:ic_media_play',
	FAST_FORWARD : 'ti:Sys:ic_media_ff',
	PAUSE : 'ti:Sys:ic_media_pause',
	REWIND : 'ti:Sys:ic_media_rew',
	EDIT : 'ti:Sys:ic_menu_edit',
	CANCEL : 'ti:Sys:ic_menu_close_clear_cancel',
	SAVE : 'ti:Sys:ic_menu_save',
	DONE : 'ti:Sys:ic_menu_mark',
	// Android Only?
	BACK : 'ti:Sys:ic_menu_back',
	FORWARD : 'ti:Sys:ic_menu_forward',
	HELP : 'ti:Sys:ic_menu_help',
	HOME : 'ti:Sys:ic_menu_home',
	NEXT : 'ti:Sys:ic_media_next',
	PREFERENCES : 'ti:Sys:ic_menu_preferences',
	PREVIOUS : 'ti:Sys:ic_media_previous',
	REVERT : 'ti:Sys:ic_menu_revert',
	SEND : 'ti:Sys:ic_menu_send',
	SHARE : 'ti:Sys:ic_menu_share',
	VIEW : 'ti:Sys:ic_menu_view',
	ZOOM : 'ti:Sys:ic_menu_zoom'
};

/**
 * @tiapi(method=true,name=UI.ActivityIndicator.setLocation,since=0.4) Set the location of the activity indicator
 * @tiarg[int,location] STATUS_BAR or DIALOG
 */
ActivityIndicator.prototype.setLocation = function(loc) {
	if (! (loc == Titanium.UI.ActivityIndicator.STATUS_BAR ||
			loc == Titanium.UI.ActivityIndicator.DIALOG)) {
		throw new Error("Unsupported indicator location.");
	}
	this.proxy.setLocation(loc);
};
/**
 * @tiapi(method=true,name=UI.ActivityIndicator.setType,since=0.4) Set the type of activity indicator
 * @tiarg[int,type] INDETERMINANT or DETERMINANT
 */
ActivityIndicator.prototype.setType = function(type) {
	if (!(type == Titanium.UI.ActivityIndicator.DETERMINANT ||
			type == Titanium.UI.ActivityIndicator.INDETERMINANT)) {
		throw new Error("Unsupported indicator type.");
	}
	this.proxy.setType(type);
};

/**
 * @tiapi(method=true,name=UI.createNotification,since=0.4) Create a notification object
 * @tiarg[hash,options,optional=true] Configuration options
 * @tiresult[Notifier] the notifier.
 */
Titanium.UI.createNotification = function(options)
{
	proxy = Titanium.uiProxy.createNotification();
	notifier = null;
	if (proxy != null) {
		notifier = new TitaniumNotifier(proxy);
		if (options != null) {
			var title = options['title'];
			var message = options['message'];
			var color = options['color'];
			var delay = options['delay'];
			var transparency = options['transparency'];

			if (!isUndefined(title)) {
				notifier.setTitle(title);
			}
			if (!isUndefined(message)) {
				notifier.setMessage(message);
			}
			if (!isUndefined(color)) {
				notifier.setColor(color);
			}
			if (!isUndefined(delay)) {
				notifier.setDelay(delay);
			}
			if (!isUndefined(transparency)) {
				notifier.setTransparency(transparency);
			}
		}
	} else {
		Titanium.API.warn("Unable to create proxy, returning null.");
	}
	return notifier;
};

Titanium.UI.iPhone = {
	BORDERED : -1,
	StatusBar : {
		OPAQUE_BLACK : -1
	},
	setStatusBarStyle : function(x) {

	},
	SystemButton : {
		PAUSE : -1,
		REWIND : -1,
		PLAY : -1,
		FIXED_SPACE : -1,
		FLEXIBLE_SPACE : -1,
	}
};


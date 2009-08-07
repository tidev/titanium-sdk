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
	 * @tiapi(method=true,name=UI.ActivityIndicator.setValue,since=0.5.1) Set the current indicator position between min and max
	 * @tiarg[int,n] the position
	 */
	this.setValue = function(n) {
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

var EmailDialog = function(proxy) {
	this.proxy = proxy;

	this.setSubject = function(subject) {
		if (isUndefined(subject)) {
			subject = null;
		}
		proxy.setSubject(subject);
	};
	this.toStringArray = function(addrs) {
		var sa = [];
		if (!isUndefined(addrs)) {
			if (typeOf(addrs) === 'string') {
				Titanium.API.debug("addrs is string");
				sa.push(addrs);
			} else if (typeOf(addrs) === 'array') {
				Titanium.API.debug("addrs is array");
				for (addr in addrs) {
					if (typeOf(addrs[addr]) === 'string') {
						sa.push(addrs[addr]);
					}
				}
			}
		}
		Titanium.API.debug("*** sa=" + String(sa));
		return sa;
	};
	this.setToRecipients = function(addrs) {
		addrs = this.toStringArray(addrs);
		for (addr in addrs) {
			this.proxy.addTo(addrs[addr]);
		}
	};
	this.setCcRecipients = function(addrs) {
		addrs = this.toStringArray(addrs);
		for (addr in addrs) {
			this.proxy.addCc(addrs[addr]);
		}
	};
	this.setBccRecipients = function(addrs) {
		addrs = this.toStringArray(addrs);
		for (addr in addrs) {
			this.proxy.addBcc(addrs[addr]);
		}
	};
	this.setMessageBody = function(msg) {
		this.proxy.setMessage(msg);
	};
	this.addAttachment = function(attachment) {
		if (!isUndefined(attachment)) {
			this.proxy.addAttachment(Titanium.JSON.stringify(attachment));
		}
	};
	this.open = function() {
		this.proxy.open();
	};
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
	/**
	 * @tiapi(method=true,name=UI.TableView.getIndexByName,since=0.5.1) the current index of the first
	 * @tiapi row with the given name, searching from 0.
	 * @tiarg[int,index] index of the first row with name or -1 if not found.
	 */
	this.getIndexByName = function(name) {
		return this.proxy.getIndexByName(name);
	};
	this.getName = function() {
		return this.proxy.getName();
	};
	this.setName = function(name) {
		if(!isUndefined(name)) {
			this.proxy.setName(name);
		}
	};
	this.setIsPrimary = function(primary) {
		this.proxy.setIsRoot(primary);
	};
	this.configure = function(options) {
		var opt = null;
		if (!isUndefined(options)) {
			opt = Titanium.JSON.stringify(options);
		}
		this.proxy.configure(opt, registerCallback(this, this._callback));
	};
	this.close = function() {
		this.proxy.close();
	}
};

var WebView = function(proxy) {
	this.proxy = proxy; // reference to Java object
	this.getName = function() {
		return this.proxy.getName();
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

	// View methods in 0.5.1

	/**
	 * @tiapi(method=true,name=UI.UserWindow.addView,since=0.5.1) add a view at the end of the view list
	 * @tiarg[View,view] The view object
	 * @tiarg[object, options] options
	 */
	this.addView = function(view) {
		this.proxy.addView(view.proxy);
	};

	/**
	 * @tiapi(method=true,name=UI.UserWindow.getViews,since=0.5.1) an array of views
	 * @tiresult[array] the views
	 */
	this.getViews = function() {
		var views = [];
		var count = this.proxy.getViewCount();
		for(i = 0; i < count; i++) {
			v = {};
			v.proxy = this.proxy.getView(i);
			v.index = i;
			v.name = v.proxy.getName();
			views[i] = v;
		}
		return views;
	};

	/**
	 * @tiapi(method=true,name=UI.UserWindow.setActiveViewIndex,since=0.5.1) The index of the view to display in the window
	 * @tiarg[int,index] The index of the view in the array returned by getViews()
	 * @tiarg[object, options] options
	 */
	this.setActiveViewIndex = function(index, options) {
		if (isUndefined(options)) {
			options = null;
		}
		this.proxy.setActiveViewIndex(index, options);
	};

	/**
	 * @tiapi(method=true,name=UI.UserWindow.showView,since=0.5.1) locate a view in the views array and display in the window
	 * @tiarg[View,view] The view object
	 * @tiarg[object, options] options
	 */
	this.showView = function(view, options) {
		if (isUndefined(options)) {
			options = null;
		}
		this.proxy.showView(view.proxy, options);
	};
	/**
	 * @tiapi(method=true,name=UI.UserWindow.getViewByName,since=0.5.1) locate a view in the views array by name
	 * @tiarg[String,name] The view name
	 * @tiarg[object, view] the view
	 */
	this.getViewByName = function(name) {
		var v = null;
		if (!isUndefined(name)) {
			var views = this.getViews();

			for(i = 0; i < views.length; i++) {
				var view = views[i];
				Titanium.API.debug("*** Name: " + name + " vName: " + view.name);
				if (!isUndefined(view.name)) {
					if (name == view.name) {
						v = view;
						break;
					}
				}
			}
		}
		return v;
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
	this.setTitleControl = function(button) {

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
};

var Switch = function(proxy) {
	this.proxy = proxy;

	this.addEventListener = function(eventName, listener) {
		return this.proxy.addEventListener(eventName, registerCallback(this, listener));
	};
	this.removeEventListener = function(eventname, listenerId) {
		this.proxy.removeEventListener(eventName, listenerId);
	};
};

var Slider = function(proxy) {
	this.proxy = proxy;

	this.addEventListener = function(eventName, listener) {
		return this.proxy.addEventListener(eventName, registerCallback(this, listener));
	};
	this.removeEventListener = function(eventname, listenerId) {
		this.proxy.removeEventListener(eventName, listenerId);
	};
};

var TextArea = function(proxy) {
	this.proxy = proxy;

	this.addEventListener = function(eventName, listener) {
		return this.proxy.addEventListener(eventName, registerCallback(this, listener));
	};
	this.removeEventListener = function(eventname, listenerId) {
		this.proxy.removeEventListener(eventName, listenerId);
	};
};

var TextField = function(proxy) {
	this.proxy = proxy;

	this.addEventListener = function(eventName, listener) {
		return this.proxy.addEventListener(eventName, registerCallback(this, listener));
	};
	this.removeEventListener = function(eventname, listenerId) {
		this.proxy.removeEventListener(eventName, listenerId);
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
		ind.setLocation(1); // Dialog
		if (!isUndefined(options)) {
			var message = options['message'];
			var loc = options['location'];
			var type = options['type'];
			var minVal = options['min'];
			var maxVal = options['max'];
			var value = options['value'];

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
			if (!isUndefined(value)) {
				ind.setValue(value);
			}
		}
		return ind;
	},
	/**
	 * @tiapi(method=true,name=UI.createActivityIndicator,since=0.4) Create an activity indicator
	 * @tiarg[hash,options,optional=true] options for configuring the activiy indicator
	 * @tiresult[ActivityIndicator] the dialog.
	 */
	createProgressBar : function(options) {
		var ind = new ActivityIndicator(Titanium.uiProxy.createProgressDialog());
		ind.setLocation(0); // StatusBar

		if (!isUndefined(options)) {
			var message = options['message'];
			var loc = options['location'];
			var type = options['type'];
			var minVal = options['min'];
			var maxVal = options['max'];
			var value = options['value'];

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
			if (!isUndefined(value)) {
				ind.setValue(value);
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
			 var name = options['name'];

			 if (!isUndefined(data)) {
				 tv.setData(Titanium.JSON.stringify(data));
			 }
			 if (!isUndefined(rowHeight)) {
				 tv.setRowHeight(rowHeight);
			 }
			 if (!isUndefined(isPrimary)) {
				 tv.setIsPrimary(isPrimary);
			 }
			 if (!isUndefined(name)) {
				 tv.setName(name);
			 }
		 }

		 tv.configure(null, registerCallback(this, this._callback));

		 return tv;
	},
	/**
	 * @tiapi(method=true,name=UI.createTableView,since=0.5) Create a table view
	 * @tiarg[object, options] a dictionary/hash of options
	 * @tiresult[TableView] the table view.
	 */
	createWebView : function(options) {
		 var wv = new WebView(Titanium.uiProxy.createWebView());

		 if(!isUndefined(options)) {
			 var url = options['url'];
			 var name = options['name'];

			 if (!isUndefined(url)) {
				 //wv.setUrl(url);
				 wv.proxy.setUrl(url);
			 }
			 if (!isUndefined(name)) {
				 wv.proxy.setName(name);
			 }
		 }

		 wv.proxy.configure(null);

		 return wv;
	},
	createEmailDialog : function(options) {
		var dlg = new EmailDialog(Titanium.uiProxy.createEmailDialog());
		if (!isUndefined(options)) {
			var subject = options["subject"];
			var to = options["toRecipients"];
			var cc = options["ccRecipients"];
			var bcc = options["bccRecipients"];
			var msg = options["messageBody"];
			var attachment = options["attachment"];

			if (!isUndefined(subject)) {
				dlg.setSubject(subject);
			}
			if (!isUndefined(to)) {
				dlg.setToRecipients(to);
			}
			if (!isUndefined(cc)) {
				dlg.setCcRecipients(cc);
			}
			if (!isUndefined(bcc)) {
				dlg.setBccRecipients(bcc);
			}
			if (!isUndefined(msg)) {
				dlg.setMessageBody(msg);
			}
			if (!isUndefined(attachment)) {
				Titanium.API.debug("Attachment: " + Titanium.JSON.stringify(attachment));
				dlg.addAttachment(attachment);
			}
		}

		return dlg;
	},
	/**
	 * @tiapi(method=true,name=UI.createButton,since=0.5.1) Create a native button
	 * @tiarg[object, options] a set of configuration options for the button
	 * @tiresult[Button] the button.
	 */
	createButton : function(options) {
		var c = new Button(Titanium.uiProxy.createButton(Titanium.JSON.stringify(options)));
		c.proxy.open();
		return c;
	},

	/**
	 * @tiapi(method=true,name=UI.createSwitch,since=0.5.1) Create a native toggle
	 * @tiarg[object, options] a set of configuration options for the switch/toggle.
	 * @tiresult[Switch] the Switch.
	 */
	createSwitch : function(options) {
		var c = new Switch(Titanium.uiProxy.createSwitch(Titanium.JSON.stringify(options)));
		c.proxy.open();
		return c;
	},

	/**
	 * @tiapi(method=true,name=UI.createTextField,since=0.5.1) Create a native Slider
	 * @tiarg[object, options] a set of configuration options for the Slider.
	 * @tiresult[Slider] the Slider.
	 */
	createSlider : function(options) {
		var c = new Slider(Titanium.uiProxy.createSlider(Titanium.JSON.stringify(options)));
		c.proxy.open();
		return c;
	},

	/**
	 * @tiapi(method=true,name=UI.createTextArea,since=0.5.1) Create a native text editor
	 * @tiarg[object, options] a set of configuration options for the text.
	 * @tiresult[TextArea] the TextArea.
	 */
	createTextArea : function(options) {
		var c = new TextArea(Titanium.uiProxy.createTextArea(Titanium.JSON.stringify(options)));
		c.proxy.open();
		return c;
	},

	RETURNKEY_GO : 0,
	RETURNKEY_GOOGLE : 1,
	RETURNKEY_JOIN : 2,
	RETURNKEY_NEXT : 3,
	RETURNKEY_ROUTE : 4,
	RETURNKEY_SEARCH : 5,
	RETURNKEY_YAHOO : 6,
	RETURNKEY_DONE : 7,
	RETURNKEY_EMERGENCY_CALL : 8,

	KEYBOARD_ASCII : 0,
	KEYBOARD_NUMBERS_PUNCTUATION : 1,
	KEYBOARD_URL : 2,
	KEYBOARD_NUMBER_PAD : 3,
	KEYBOARD_PHONE_PAD : 4,
	KEYBOARD_EMAIL_ADDRESS : 5,

	INPUT_BORDERSTYLE_NONE : 0,
	INPUT_BORDERSTYLE_ROUNDED : 1,
	INPUT_BORDERSTYLE_BEZEL : 2,
	INPUT_BORDERSTYLE_LINE : 3,

	INPUT_BUTTONMODE_ONFOCUS : 0,
	INPUT_BUTTONMODE_ALWAYS : 1,
	INPUT_BUTTONMODE_NEVER : 2,

	/**
	 * @tiapi(method=true,name=UI.createTextField,since=0.5.1) Create a native text field
	 * @tiarg[object, options] a set of configuration options for the text.
	 * @tiresult[TextField] the TextField.
	 */
	createTextField : function(options) {
		var c = new TextField(Titanium.uiProxy.createTextField(Titanium.JSON.stringify(options)));
		c.proxy.open();
		return c;
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
	/**
	 * @tiapi(property=true,name=UI.Android.SystemIcon.ACTION,since=0.4) icon
	 */
	ACTION : 'ti:Ti:default_icon',
	/**
	 * @tiapi(property=true,name=UI.Android.SystemIcon.CAMERA,since=0.4) icon
	 */
	CAMERA : 'ti:Sys:ic_menu_camera',
	/**
	 * @tiapi(property=true,name=UI.Android.SystemIcon.COMPOSE,since=0.4) icon
	 */
	COMPOSE: 'ti:Sys:ic_menu_compose',
	/**
	 * @tiapi(property=true,name=UI.Android.SystemIcon.BOOKMARKS,since=0.4) icon
	 */
	BOOKMARKS : 'ti:Ti:default_icon',
	/**
	 * @tiapi(property=true,name=UI.Android.SystemIcon.SEARCH,since=0.4) icon
	 */
	SEARCH : 'ti:Sys:ic_menu_search',
	/**
	 * @tiapi(property=true,name=UI.Android.SystemIcon.ADD,since=0.4) icon
	 */
	ADD : 'ti:Sys:ic_menu_add',
	/**
	 * @tiapi(property=true,name=UI.Android.SystemIcon.TRASH,since=0.4) icon
	 */
	TRASH : 'ti:Sys:ic_menu_delete',
	/**
	 * @tiapi(property=true,name=UI.Android.SystemIcon.ORGANIZE,since=0.4) icon
	 */
	ORGANIZE : 'ti:Sys:ic_menu_archive',
	/**
	 * @tiapi(property=true,name=UI.Android.SystemIcon.REPLY,since=0.4) icon
	 */
	REPLY : 'ti:Ti:default_icon',
	/**
	 * @tiapi(property=true,name=UI.Android.SystemIcon.STOP,since=0.4) icon
	 */
	STOP : 'ti:Sys:ic_menu_stop',
	/**
	 * @tiapi(property=true,name=UI.Android.SystemIcon.REFRESH,since=0.4) icon
	 */
	REFRESH : 'ti:Sys:ic_menu_refresh',
	/**
	 * @tiapi(property=true,name=UI.Android.SystemIcon.PLAY,since=0.4) icon
	 */
	PLAY : 'ti:Sys:ic_media_play',
	/**
	 * @tiapi(property=true,name=UI.Android.SystemIcon.FAST_FORWARD,since=0.4) icon
	 */
	FAST_FORWARD : 'ti:Sys:ic_media_ff',
	/**
	 * @tiapi(property=true,name=UI.Android.SystemIcon.PAUSE,since=0.4) icon
	 */
	PAUSE : 'ti:Sys:ic_media_pause',
	/**
	 * @tiapi(property=true,name=UI.Android.SystemIcon.REWIND,since=0.4) icon
	 */
	REWIND : 'ti:Sys:ic_media_rew',
	/**
	 * @tiapi(property=true,name=UI.Android.SystemIcon.EDIT,since=0.4) icon
	 */
	EDIT : 'ti:Sys:ic_menu_edit',
	/**
	 * @tiapi(property=true,name=UI.Android.SystemIcon.CANCEL,since=0.4) icon
	 */
	CANCEL : 'ti:Sys:ic_menu_close_clear_cancel',
	/**
	 * @tiapi(property=true,name=UI.Android.SystemIcon.SAVE,since=0.4) icon
	 */
	SAVE : 'ti:Sys:ic_menu_save',
	/**
	 * @tiapi(property=true,name=UI.Android.SystemIcon.DONE,since=0.4) icon
	 */
	DONE : 'ti:Sys:ic_menu_mark',
	// Android Only?
	/**
	 * @tiapi(property=true,name=UI.Android.SystemIcon.BACK,since=0.4) icon
	 */
	BACK : 'ti:Sys:ic_menu_back',
	/**
	 * @tiapi(property=true,name=UI.Android.SystemIcon.FORWARD,since=0.4) icon
	 */
	FORWARD : 'ti:Sys:ic_menu_forward',
	/**
	 * @tiapi(property=true,name=UI.Android.SystemIcon.HELP,since=0.4) icon
	 */
	HELP : 'ti:Sys:ic_menu_help',
	/**
	 * @tiapi(property=true,name=UI.Android.SystemIcon.HOME,since=0.4) icon
	 */
	HOME : 'ti:Sys:ic_menu_home',
	/**
	 * @tiapi(property=true,name=UI.Android.SystemIcon.NEXT,since=0.4) icon
	 */
	NEXT : 'ti:Sys:ic_media_next',
	/**
	 * @tiapi(property=true,name=UI.Android.SystemIcon.PREFERENCES,since=0.4) icon
	 */
	PREFERENCES : 'ti:Sys:ic_menu_preferences',
	/**
	 * @tiapi(property=true,name=UI.Android.SystemIcon.PREVIOUS,since=0.4) icon
	 */
	PREVIOUS : 'ti:Sys:ic_media_previous',
	/**
	 * @tiapi(property=true,name=UI.Android.SystemIcon.REVERT,since=0.4) icon
	 */
	REVERT : 'ti:Sys:ic_menu_revert',
	/**
	 * @tiapi(property=true,name=UI.Android.SystemIcon.SEND,since=0.4) icon
	 */
	SEND : 'ti:Sys:ic_menu_send',
	/**
	 * @tiapi(property=true,name=UI.Android.SystemIcon.SHARE,since=0.4) icon
	 */
	SHARE : 'ti:Sys:ic_menu_share',
	/**
	 * @tiapi(property=true,name=UI.Android.SystemIcon.VIEW,since=0.4) icon
	 */
	VIEW : 'ti:Sys:ic_menu_view',
	/**
	 * @tiapi(property=true,name=UI.Android.SystemIcon.ZOOM,since=0.4) icon
	 */
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
	},
	SystemButtonStyle : {
		PLAIN : -1
	},
	AnimationStyle : {
		FLIP_FROM_LEFT : -1,
		FLIP_FROM_RIGHT : -1,
		CURL_UP : -1,
		CURL_DOWN : -1
	}
};


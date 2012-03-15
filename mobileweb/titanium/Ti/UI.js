define(
	["Ti/_", "Ti/_/Evented", "Ti/_/lang", "Ti/_/ready", "Ti/_/style", "Ti/_/dom"],
	function(_, Evented, lang, ready, style, dom) {

	var body = document.body,
		isIOS = /(iPhone|iPad)/.test(navigator.userAgent),
		modules = "2DMatrix,ActivityIndicator,AlertDialog,Animation,Button,EmailDialog,ImageView,Label,OptionDialog,Picker,PickerColumn,PickerRow,ProgressBar,ScrollableView,ScrollView,Slider,Switch,Tab,TabGroup,TableView,TableViewRow,TableViewSection,TextArea,TextField,View,WebView,Window",
		creators = {},
		setStyle = style.set,
		undef;

	body.addEventListener('touchmove', function(e) {
		e.preventDefault();
	}, false);

	require.each(modules.split(','), function(name) {
		creators['create' + name] = function(args) {
			var m = require("Ti/UI/" + name);
			return new m(args);
		};
	});

	function hideAddressBar() {
		var x = 0;
		if (isIOS && !window.location.hash) {
			if (document.height <= window.outerHeight + 10) {
				setStyle(body, "height", (window.outerHeight + 60) + "px");
				x = 50;
			}
			setTimeout(function() {
				window.scrollTo(0, 1);
				window.scrollTo(0, 0);
				Ti.UI._recalculateLayout();
			}, x);
		}
	}

	if (isIOS) {
		ready(hideAddressBar);
		window.addEventListener("orientationchange", hideAddressBar);
	}

	ready(10, function() {
		body.appendChild((Ti.UI._container = Ti.UI.createView({
			left: 0,
			top: 0
		})).domNode);
		setStyle(Ti.UI._container.domNode,"overflow","hidden");
		Ti.UI._recalculateLayout();
	});

	require.on(window, "resize", function() {
		Ti.UI._recalculateLayout();
		Ti.Gesture._updateOrientation();
	});

	return lang.setObject("Ti.UI", Evented, creators, {

		_addWindow: function(win, set) {
			this._container.add(win.modal ? win._modalParentContainer : win);
			set && this._setWindow(win);
			return win;
		},

		_setWindow: function(win) {
			this.constants.currentWindow = win;
		},

		_removeWindow: function(win) {
			this._container.remove(win.modal ? win._modalParentContainer : win);
			return win;
		},
		
		_layoutSemaphore: 0,
		
		_nodesToLayout: [],
		
		_startLayout: function() {
			this._layoutSemaphore++;
		},
		
		_finishLayout: function() {
			this._layoutSemaphore--;
			if (this._layoutSemaphore === 0) {
				this._triggerLayout(true);
			}
		},
		
		_elementLayoutCount: 0,
		
		_layoutCount: 0,
		
		_triggerLayout: function(node, force) {
			var self = this;
			if (~self._nodesToLayout.indexOf(node)) {
				return;
			}
			self._nodesToLayout.push(node);
			function startLayout() {
				
				self._elementLayoutCount = 0;
				self._layoutCount++;
				var startTime = (new Date()).getTime(),
					nodes = self._nodesToLayout,
					layoutNode,
					node,
					parent,
					previousParent,
					children,
					child,
					recursionStack,
					rootNodesToLayout = [],
					layoutRootNode = false;
					
				// Determine which nodes need to be re-layed out
				for (var i in nodes) {
					layoutNode = nodes[i];
						
					// Mark all of the children for update that need to be updated
					recursionStack = [layoutNode];
					while (recursionStack.length > 0) {
						node = recursionStack.pop();
						node._markedForLayout = true;
						children = node.children;
						for (var j in children) {
							child = children[j];
							if (node.layout !== "composite" || child._isDependentOnParent || !child._hasBeenLayedOut) {
								recursionStack.push(child);
							}
						}
					}
					
					// Go up and mark any other nodes that need to be marked
					parent = layoutNode;
					while(1) {
						if (!parent._parent) {
							layoutRootNode = true;
							break;
						} else if(!parent._parent._hasSizeDimensions()) {
							!parent._parent._markedForLayout && rootNodesToLayout.push(parent._parent);
							break;
						}
						
						previousParent = parent;
						parent = parent._parent;
						recursionStack = [parent];
						while (recursionStack.length > 0) {
							node = recursionStack.pop();
							children = node.children;
							for (var j in children) {
								child = children[j];
								if (child !== previousParent && (node.layout !== "composite" || child._isDependentOnParent)) {
									child._markedForLayout = true;
									recursionStack.push(child);
								}
							}
						}
					}
				}
				
				// Layout all nodes that need it
				if (layoutRootNode) {
					var container = self._container;
					container._doLayout({
					 	origin: {
					 		x: 0,
					 		y: 0
					 	},
					 	isParentSize: {
					 		width: false,
					 		height: false
					 	},
					 	boundingSize: {
					 		width: window.innerWidth,
					 		height: window.innerHeight
					 	},
					 	alignment: {
					 		horizontal: "center",
					 		vertical: "center"
					 	},
					 	positionElement: true,
					 	layoutChildren: true
				 	});
				}
				for (var i in rootNodesToLayout) {
					node = rootNodesToLayout[i];
					node._layout._doLayout(node, node._measuredWidth, node._measuredHeight, node.width === Ti.UI.SIZE, node.height === Ti.UI.SIZE);
				}
				
				console.debug("Layout " + self._layoutCount + ": " + self._elementLayoutCount + 
					" elements laid out in " + ((new Date().getTime() - startTime)) + "ms");
					
				self._layoutInProgress = false;
				self._layoutTimer = null;
				self._nodesToLayout = [];
			}
			if (force) {
				clearTimeout(self._layoutTimer);
				self._layoutInProgress = true;
				startLayout();
			} else if (self._nodesToLayout.length === 1) {
				self._layoutInProgress = true;
				self._layoutTimer = setTimeout(function(){ startLayout(); }, 25);
			}
		},
		
		_recalculateLayout: function() {
			var container = this._container;
			container.width = window.innerWidth;
			container.height = window.innerHeight;
		},

		properties: {
			backgroundColor: {
				set: function(value) {
					return setStyle(body, "backgroundColor", value);
				}
			},
			backgroundImage: {
				set: function(value) {
					return setStyle(body, "backgroundImage", value ? style.url(value) : "");
				}
			},
			currentTab: undef
		},
		
		convertUnits: function(convertFromValue, convertToUnits) {
			var intermediary = dom.computeSize(convertFromValue, 0, false);
			switch(convertToUnits) {
				case Ti.UI.UNIT_MM:
					intermediary *= 10;
				case Ti.UI.UNIT_CM:
					return intermediary / ( 0.0393700787 * _.dpi * 10);
				case Ti.UI.UNIT_IN:
					return intermediary / _.dpi;
				case Ti.UI.UNIT_DIP:
					return intermediary * 96 / _.dpi;
				case Ti.UI.UNIT_PX:
					return intermediary;
				default: return 0;
			}
		},

		constants: {
			currentWindow: undefined,
			UNKNOWN: 0,
			FACE_DOWN: 1,
			FACE_UP: 2,
			PORTRAIT: 3,
			UPSIDE_PORTRAIT: 4,
			LANDSCAPE_LEFT: 5,
			LANDSCAPE_RIGHT: 6,
			INPUT_BORDERSTYLE_NONE: 0, // DO NOT CHANGE! Values are referenced directly in code
			INPUT_BORDERSTYLE_LINE: 1, // DO NOT CHANGE! Values are referenced directly in code
			INPUT_BORDERSTYLE_BEZEL: 2, // DO NOT CHANGE! Values are referenced directly in code
			INPUT_BORDERSTYLE_ROUNDED: 3, // DO NOT CHANGE! Values are referenced directly in code
			KEYBOARD_DEFAULT: 2,
			KEYBOARD_EMAIL: 3,
			KEYBOARD_NUMBER_PAD: 6,
			KEYBOARD_PHONE_PAD: 7,
			KEYBOARD_URL: 8,
			NOTIFICATION_DURATION_LONG: 1,
			NOTIFICATION_DURATION_SHORT: 2,
			PICKER_TYPE_DATE: 2,
			PICKER_TYPE_DATE_AND_TIME: 3,
			PICKER_TYPE_PLAIN: 4,
			PICKER_TYPE_TIME: 5,
			RETURNKEY_DEFAULT: 0, // return
			RETURNKEY_DONE: 1, // Done
			RETURNKEY_EMERGENCY_CALL: 2, // Emergency Call
			RETURNKEY_GO: 3, // Go
			RETURNKEY_GOOGLE: 4, // Search
			RETURNKEY_JOIN: 5, // Join
			RETURNKEY_NEXT: 6, // Next
			RETURNKEY_ROUTE: 7, // Route
			RETURNKEY_SEARCH: 8, // Search
			RETURNKEY_SEND: 9, // Send
			RETURNKEY_YAHOO: 10, // Search
			TEXT_ALIGNMENT_CENTER: 1,
			TEXT_ALIGNMENT_RIGHT: 2,
			TEXT_ALIGNMENT_LEFT: 3,
			TEXT_AUTOCAPITALIZATION_ALL: 3,
			TEXT_AUTOCAPITALIZATION_NONE: 0,
			TEXT_AUTOCAPITALIZATION_SENTENCES: 2,
			TEXT_AUTOCAPITALIZATION_WORDS: 1,
			TEXT_VERTICAL_ALIGNMENT_BOTTOM: 2,
			TEXT_VERTICAL_ALIGNMENT_CENTER: 1,
			TEXT_VERTICAL_ALIGNMENT_TOP: 3,
			ANIMATION_CURVE_EASE_IN: 1,
			ANIMATION_CURVE_EASE_IN_OUT: 2,
			ANIMATION_CURVE_EASE_OUT: 3,
			ANIMATION_CURVE_LINEAR: 4,
			SIZE: "auto",
			FILL: "fill",
			UNIT_PX: "px",
			UNIT_MM: "mm",
			UNIT_CM: "cm",
			UNIT_IN: "in",
			UNIT_DIP: "dp" // We don't have DIPs, so we treat them as pixels
		}

	});

});
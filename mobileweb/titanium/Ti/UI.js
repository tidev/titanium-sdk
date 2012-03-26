define(
	["Ti/_", "Ti/_/Evented", "Ti/_/lang", "Ti/_/ready", "Ti/_/style", "Ti/_/dom"],
	function(_, Evented, lang, ready, style, dom) {

	var global = window,
		body = document.body,
		on = require.on,
		modules = "2DMatrix,ActivityIndicator,AlertDialog,Animation,Button,EmailDialog,ImageView,Label,OptionDialog,Picker,PickerColumn,PickerRow,ProgressBar,ScrollableView,ScrollView,Slider,Switch,Tab,TabGroup,TableView,TableViewRow,TableViewSection,TextArea,TextField,View,WebView,Window",
		creators = {},
		setStyle = style.set,
		handheld = navigator.userAgent.toLowerCase().match(/(iphone|android)/),
		iphone = handheld && handheld[0] === "iphone",
		targetHeight = {},
		hidingAddressBar,
		hideAddressBar = finishAddressBar = function() {
			Ti.UI._recalculateLayout();
			hidingAddressBar = 0;
		},
		unitize = dom.unitize,
		showStats = false;

	on(body, "touchmove", function(e) {
		e.preventDefault();
	});

	require.each(modules.split(','), function(name) {
		creators['create' + name] = function(args) {
			return new (require("Ti/UI/" + name))(args);
		};
	});

	if (!navigator.standalone && handheld) {
		hideAddressBar = function() {
			if (!hidingAddressBar) {
				hidingAddressBar = 1;
				var isPortrait = require("Ti/Gesture").isPortrait | 0,
					h = targetHeight[isPortrait],
					timer;

				if (!h) {
					if (iphone) {
						h = global.innerHeight + 60;
						if (global.screen.availHeight - h > 50) {
							h += 50;
						}
					} else {
						h = global.outerHeight / (global.devicePixelRatio || 0);
					}
					targetHeight[isPortrait] = h;
				}

				setStyle(body, "height", h + "px");

				if (iphone) {
					global.scrollTo(0, 0);
					finishAddressBar();
				} else {
					timer = setInterval(function() {
						global.scrollTo(0, -1);
						if (global.innerHeight + 1 >= h) {
							clearTimeout(timer);
							finishAddressBar();
						}
					}, 50);
				}
			}
		}
		ready(hideAddressBar);
		on(global, "orientationchange", hideAddressBar);
		on(global, "touchstart", hideAddressBar);
	}

	ready(10, function() {
		var splashScreen = document.getElementById("splash"),
			container = (Ti.UI._container = Ti.UI.createView({
				left: 0,
				top: 0
			})),
			node = container.domNode;
		setStyle(node, "overflow", "hidden");
		body.appendChild(node);
		container.addEventListener("postlayout", function(){
			setTimeout(function(){
				setStyle(splashScreen,{
					position: "absolute",
					width: unitize(container._measuredWidth),
					height: unitize(container._measuredHeight),
					left: "0px",
					top: "0px",
					right: "",
					bottom: ""
				});
			},10);
		});
		hideAddressBar();
	});
	
	function updateOrientation() {
		Ti.UI._recalculateLayout();
		require("Ti/Gesture")._updateOrientation();
	}
	on(global, "resize", updateOrientation);
	on(global, "orientationchange", updateOrientation);

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
					layoutRootNode = false,
					breakAfterChildrenCalculations;
					
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
							if (node.layout !== "composite" || child._isDependentOnParent() || !child._hasBeenLayedOut) {
								recursionStack.push(child);
							}
						}
					}
					
					// Go up and mark any other nodes that need to be marked
					parent = layoutNode;
					while(1) {
						breakAfterChildrenCalculations = false;
						if (!parent._parent) {
							layoutRootNode = true;
							break;
						} else if(!parent._parent._hasSizeDimensions()) {
							!parent._parent._markedForLayout && !~rootNodesToLayout.indexOf(parent._parent) && rootNodesToLayout.push(parent._parent);
							if (parent._parent.layout !== "composite") {
								breakAfterChildrenCalculations = true;
							} else {
								break;
							}
						}
						
						previousParent = parent;
						parent = parent._parent;
						recursionStack = [parent];
						while (recursionStack.length > 0) {
							node = recursionStack.pop();
							children = node.children;
							for (var j in children) {
								child = children[j];
								if (child !== previousParent && (node.layout !== "composite" || child._isDependentOnParent())) {
									child._markedForLayout = true;
									recursionStack.push(child);
								}
							}
						}
						if (breakAfterChildrenCalculations) {
							break;
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
					 		width: global.innerWidth,
					 		height: global.innerHeight
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
					node._layout._doLayout(node, node._measuredWidth, node._measuredHeight, node._getInheritedWidth() === Ti.UI.SIZE, node._getInheritedHeight() === Ti.UI.SIZE);
				}
				
				showStats && console.debug("Layout " + self._layoutCount + ": " + self._elementLayoutCount + 
					" elements laid out in " + ((new Date().getTime() - startTime)) + "ms");
					
				self._layoutInProgress = false;
				self._layoutTimer = null;
				self._nodesToLayout = [];
				
				self.fireEvent("postlayout");
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
			if (container) {
				container.width = global.innerWidth;
				container.height = global.innerHeight;
			}
		},

		properties: {
			backgroundColor: {
				set: function(value) {
					return this._container.backgroundColor = value;
				}
			},
			backgroundImage: {
				set: function(value) {
					return setStyle(body, "backgroundImage", value ? style.url(value) : "");
				}
			},
			currentTab: void 0
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
			currentWindow: void 0,
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
			TEXT_ALIGNMENT_CENTER: "center",
			TEXT_ALIGNMENT_RIGHT: "right",
			TEXT_ALIGNMENT_LEFT: "left",
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
			INHERIT: "inherit",
			UNIT_PX: "px",
			UNIT_MM: "mm",
			UNIT_CM: "cm",
			UNIT_IN: "in",
			UNIT_DIP: "dp" // We don't have DIPs, so we treat them as pixels
		}

	});

});
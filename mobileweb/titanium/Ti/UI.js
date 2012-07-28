define(
	["Ti/_", "Ti/_/Evented", "Ti/_/has", "Ti/_/lang", "Ti/_/ready", "Ti/_/style", "Ti/_/dom"],
	function(_, Evented, has, lang, ready, style, dom) {

	var global = window,
		doc = document,
		body = doc.body,
		on = require.on,
		modules = "2DMatrix,ActivityIndicator,AlertDialog,Animation,Button,EmailDialog,ImageView,Label,OptionDialog,Picker,PickerColumn,PickerRow,ProgressBar,ScrollableView,ScrollView,Slider,Switch,Tab,TabGroup,TableView,TableViewRow,TableViewSection,TextArea,TextField,View,WebView,Window",
		creators = {},
		setStyle = style.set,
		handheld = navigator.userAgent.toLowerCase().match(/(iphone|android)/),
		iphone = handheld && handheld[0] === "iphone",
		targetHeight = {},
		hidingAddressBar,
		finishAddressBar = function() {
			Ti.UI._recalculateLayout();
			hidingAddressBar = 0;
		},
		hideAddressBar = finishAddressBar,
		splashScreen,
		unitize = dom.unitize,
		Gesture;

	on(body, "touchmove", function(e) {
		e.preventDefault();
	});

	modules.split(',').forEach(function(name) {
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
		setTimeout(function() {
			var container = (Ti.UI._container = Ti.UI.createView({
					left: 0,
					top: 0
				})),
				node = container.domNode,
				coefficients = container._layoutCoefficients;

			coefficients.width.x1 = 1;
			coefficients.height.x1 = 1;
			container._measuredTop = 0;
			container._measuredLeft = 0;
			node.id = "TiUIContainer";
			setStyle(node, "overflow", "hidden");
			body.appendChild(node);

			(splashScreen = doc.getElementById("splash")) && container.addEventListener("postlayout", function(){
				setTimeout(function(){
					setStyle(splashScreen,{
						position: "absolute",
						width: unitize(container._measuredWidth),
						height: unitize(container._measuredHeight),
						left: 0,
						top: 0,
						right: '',
						bottom: ''
					});
				}, 10);
			});
			hideAddressBar();
		}, 1);
	});

	on(global, "resize", function() {
		Ti.UI._recalculateLayout();
	});

	return lang.setObject("Ti.UI", Evented, creators, {

		_addWindow: function(win, set) {
			this._container.add(win.modal ? win._modalParentContainer : win);
			set && this._setWindow(win);

			// as soon as we add a window or tabgroup, we can destroy the splash screen
			splashScreen && dom.destroy(splashScreen);

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
			if (--this._layoutSemaphore === 0) {
				this._triggerLayout(true);
			}
		},

		_elementLayoutCount: 0,

		_triggerLayout: function(node, force) {
			var self = this;

			if (~self._nodesToLayout.indexOf(node)) {
				return;
			}

			self._nodesToLayout.push(node);

			function startLayout() {
				self._elementLayoutCount = 0;
				var nodes = self._nodesToLayout,
					layoutNode,
					node,
					parent,
					previousParent,
					children,
					child,
					recursionStack,
					rootNodesToLayout = [],
					layoutRootNode = false,
					breakAfterChildrenCalculations,
					container = self._container,
					i,
					j,
					len = nodes.length;

				has("ti-instrumentation") && (self._layoutInstrumentationTest = instrumentation.startTest("Layout"));

				// Determine which nodes need to be re-layed out
				for (i = 0; i < len; i++) {
					layoutNode = nodes[i];
					if (layoutNode._isAttachedToActiveWin()) {
						// Mark all of the children for update that need to be updated
						recursionStack = [layoutNode];
						while (recursionStack.length > 0) {
							node = recursionStack.pop();
							node._markedForLayout = true;
							children = node._children;
							for (j in children) {
								child = children[j];
								if (node.layout !== "composite" || child._needsMeasuring || node._layout._isDependentOnParent(child)) {
									recursionStack.push(child);
								}
							}
						}

						if (layoutNode === container) {
							layoutRootNode = true;
						} else {
							// Go up and mark any other nodes that need to be marked
							parent = layoutNode;
							while(1) {
								parent._markedForLayout = true;
								previousParent = parent;
								parent = parent._parent;

								// Check if this parent is the stopping point
								breakAfterChildrenCalculations = false;
								if (!parent || parent === container) {
									layoutRootNode = true;
									break;
								} else if(!parent._hasSizeDimensions() && !parent._needsMeasuring) {
									!parent._markedForLayout && !~rootNodesToLayout.indexOf(parent) && rootNodesToLayout.push(parent);
									breakAfterChildrenCalculations = true;
								}

								// Recurse through the children of the parent
								recursionStack = [parent];
								while (recursionStack.length > 0) {
									node = recursionStack.pop();
									children = node._children;
									for (j in children) {
										child = children[j];
										if (child !== previousParent && (node.layout !== "composite" || child._needsMeasuring || node._layout._isDependentOnParent(child))) {
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
					}
				}

				// Layout all nodes that need it
				if (layoutRootNode) {
					var container = self._container,
						props = container.properties.__values__,
						width = container._measuredWidth = props.width = global.innerWidth,
						height = container._measuredHeight = props.height = global.innerHeight;
					container._measuredSandboxWidth = width;
					container._measuredSandboxHeight = height;
					container.fireEvent("postlayout");
					setStyle(container.domNode, {
						width: width + "px",
						height: height + "px"
					});
					container._layout._doLayout(container, width, height, false, false);
				}
				for (var i in rootNodesToLayout) {
					node = rootNodesToLayout[i];
					node._layout._doLayout(node,
						node._measuredWidth - node._borderLeftWidth - node._borderRightWidth,
						node._measuredHeight - node._borderTopWidth - node._borderBottomWidth,
						node._parent._layout._getWidth(node, node.width) === Ti.UI.SIZE,
						node._parent._layout._getHeight(node, node.height) === Ti.UI.SIZE);
				}

				has("ti-instrumentation") && instrumentation.stopTest(self._layoutInstrumentationTest, 
					self._elementLayoutCount + " out of approximately " + document.getElementById("TiUIContainer").getElementsByTagName("*").length + " elements laid out.");

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
				self._layoutTimer = setTimeout(startLayout, 10);
			}
		},

		_recalculateLayout: function() {
			Gesture || (Gesture = require("Ti/Gesture"));
			Gesture._updateOrientation();
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
			TEXT_VERTICAL_ALIGNMENT_BOTTOM: "bottom",
			TEXT_VERTICAL_ALIGNMENT_CENTER: "center",
			TEXT_VERTICAL_ALIGNMENT_TOP: "top",
			ANIMATION_CURVE_EASE_IN: 1,
			ANIMATION_CURVE_EASE_IN_OUT: 0,
			ANIMATION_CURVE_EASE_OUT: 2,
			ANIMATION_CURVE_LINEAR: 3,
			SIZE: "auto",
			FILL: "fill",
			INHERIT: "inherit",
			UNIT_PX: "px",
			UNIT_MM: "mm",
			UNIT_CM: "cm",
			UNIT_IN: "in",
			UNIT_DIP: "dp", // We don't have DIPs, so we treat them as pixels
			
			// Hidden constants
			_LAYOUT_COMPOSITE: "composite",
			_LAYOUT_VERTICAL: "vertical",
			_LAYOUT_HORIZONTAL: "horizontal",
			_LAYOUT_CONSTRAINING_VERTICAL: "constrainingVertical",
			_LAYOUT_CONSTRAINING_HORIZONTAL: "constrainingHorizontal"
		}

	});

});
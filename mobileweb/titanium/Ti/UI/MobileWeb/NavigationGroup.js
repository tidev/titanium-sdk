/*global define*/
define(['Ti/_/css', 'Ti/_/declare', 'Ti/UI/View', 'Ti/UI', 'Ti/_/lang'],
	function(css, declare, View, UI, lang) {

	var isDef = lang.isDef,
		UI_FILL = UI.FILL,
		navGroupCss = 'TiUINavigationGroup';

	return declare('Ti.UI.MobileWeb.NavigationGroup', View, {

		constructor: function(args) {
			var self = this,
				win = self.__values__.constants.window = args && args.window,
				navBarContainer = self._navBarContainer = UI.createView({
					height: 50,
					width: UI.FILL,
					layout: UI._LAYOUT_CONSTRAINING_HORIZONTAL
				});
			css.add(navBarContainer.domNode, navGroupCss);
			self.layout = UI._LAYOUT_CONSTRAINING_VERTICAL;

			// Create the nav bar content
			navBarContainer.add(self._leftContainer = UI.createView({
				width: UI.SIZE,
				height: '100%',
				left: 5,
				right: 5
			}));
			navBarContainer.add(self._centerContainer = UI.createView({
				width: UI.FILL,
				height: '100%'
			}));
			navBarContainer.add(self._rightContainer = UI.createView({
				width: UI.SIZE,
				height: '100%',
				left: 5,
				right: 5
			}));
			self._add(navBarContainer);

			// Create the content container
			self._add(self._contentContainer = UI.createView({
				width: UI_FILL,
				height: UI_FILL
			}));

			// Stylize the top
			this.navBarAtTop = true;
			navBarContainer._getBorderFromCSS();

			// Initialize the window stack and add the root window
			self._windows = [];
			win && self.open(win);
		},

		_defaultWidth: UI_FILL,

		_defaultHeight: UI_FILL,

		_updateNavBar: function() {
			var _self = this,
				windows = _self._windows,
				len = windows.length,
				activeWin = windows[len - 1],
				navBarContainer = this._navBarContainer,
				leftContainer = _self._leftContainer,
				centerContainer = _self._centerContainer,
				rightContainer = _self._rightContainer,
				leftView,
				centerView,
				rightView;

			if (!activeWin) {
				return;
			}
			rightView = activeWin.rightNavButton;

			if (activeWin.leftNavButton) {
				leftView = activeWin.leftNavButton;
			} else {
				if (!_self._backButton) {
					_self._backButton = UI.createButton({
						title: 'Back'
					});
					require.on(_self._backButton, 'singletap', function() {
						// Note: we can reuse activeWin or length because they may have changed by the time this event
						// listener is called due to reuse of the back button across windows.
						_self.close(windows[windows.length - 1]);
					});
				}
				len > 1 && (leftView = _self._backButton);
			}
			if (leftContainer._children[0] !== leftView) {
				leftContainer._removeAllChildren();
				leftView && leftContainer.add(leftView);
			}

			if (rightContainer._children[0] !== rightView) {
				rightContainer._removeAllChildren();
				rightView && rightContainer.add(rightView);
			}

			navBarContainer.backgroundColor = activeWin.barColor;
			navBarContainer.backgroundImage = activeWin.barImage;
			navBarContainer.opacity = activeWin.translucent ? 0.5 : 1;
			navBarContainer.height = activeWin.navBarHidden && activeWin.modal ? 0 : 50;

			if (activeWin.titleControl) {
				centerView = activeWin.titleControl;
			} else if (activeWin.titleImage) {
				centerView = activeWin._titleImageView || (activeWin._titleImageView = UI.createImageView({
					image: activeWin.titleImage
				}));
			} else {
				centerView = activeWin._titleControl || (activeWin._titleControl = UI.createLabel({
					text: activeWin._getTitle() || (this._tab && this._tab._getTitle()) || '',
					width: '100%',
					height: '100%',
					textAlign: UI.TEXT_ALIGNMENT_CENTER
				}));
			}
			if (centerContainer._children[0] !== centerView) {
				centerContainer._removeAllChildren();
				centerView && centerContainer.add(centerView);
			}
		},

		_getTopWindow: function() {
			var windows = this._windows,
				len = windows.length;
			return len ? windows[windows.length - 1] : null;
		},

		open: function(win) {
			if (!win._opened) {
				var windows = this._windows,
					tab = this._tab;

				win._navGroup = this;

				// Set a default background
				!isDef(win.backgroundColor) && !isDef(win.backgroundImage) && (win.backgroundColor = '#fff');

				~(windows.length - 1) && windows[windows.length - 1].fireEvent('blur');

				// Show the window
				tab && (win.tabGroup = (win.tab = tab)._tabGroup);
				windows.push(win);
				this._contentContainer._add(win);
				this._updateNavBar();

				win._opened || win.fireEvent('open');
				win._opened = 1;
				win.fireEvent('focus');
			}
		},

		close: function(win) {
			var windows = this._windows,
				windowIdx = windows.indexOf(win),
				self = this;

			win._navGroup = void 0;

			// make sure the window exists and it's not the root
			if (windowIdx > 0) {
				windows.splice(windowIdx, 1);
				win.fireEvent('blur');
				self._contentContainer.remove(win);
				win.fireEvent('close');
				win._opened = 0;

				this._updateNavBar();
				windows[windows.length - 1].fireEvent('focus');
			}
		},

		_reset: function() {
			var windows = this._windows,
				win,
				i = windows.length - 1,
				l = i;

			while (1) {
				win = windows[i];
				if (!i) {
					break;
				}
				i-- === l && win.fireEvent('blur');
				this._contentContainer.remove(win);
				win.fireEvent('close');
				win._opened = 0;
			}

			windows.splice(1);
			this._updateNavBar();
			win.fireEvent('focus');
		},

		constants: {
			window: void 0,
			bubbleParent: false
		},

		properties: {
			navBarAtTop: {
				set: function (value, oldValue) {
					if (value !== oldValue) {
						var navBarContainer = this._navBarContainer,
							navBarContainerDomNode = navBarContainer.domNode;

						this._remove(navBarContainer);
						this._insertAt(navBarContainer, value ? 0 : 1);

						css.remove(navBarContainerDomNode, navGroupCss + (value ? 'Top' : 'Bottom'));
						css.add(navBarContainerDomNode, navGroupCss + (value ? 'Bottom' : 'Top'));
					}

					return value;
				}
			}
		}

	});

});
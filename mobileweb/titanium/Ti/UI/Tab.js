define(["Ti/_/declare", "Ti/UI/View", "Ti/_/dom", "Ti/Locale", "Ti/UI", "Ti/UI/MobileWeb", "Ti/UI/Label", "Ti/UI/ImageView"],
	function(declare, View, dom, Locale, UI, MobileWeb) {

	var postTitle = {
			post: function() {
				this._tabTitle.text = this._getTitle();
			}
		},
		UI_FILL = UI.FILL,
		UI_SIZE = UI.SIZE;

	return declare("Ti.UI.Tab", View, {

		constructor: function(args) {
			var win = args && args.window,
				container = UI.createView({
					layout: UI._LAYOUT_CONSTRAINING_VERTICAL,
					width: "100%",
					height: UI_SIZE
				}),
				navGroup = this._tabNavigationGroup = MobileWeb.createNavigationGroup({ window: win, _tab: this });;

			this._add(container);

			container._add(this._tabIcon = UI.createImageView({
				height: UI_SIZE,
				width: UI_SIZE
			}));

			container._add(this._tabTitle = UI.createLabel({
				width: "100%",
				wordWrap: true,
				textAlign: UI.TEXT_ALIGNMENT_CENTER
			}));

			win && require.on(this, "singletap", this, function(e) {
				var tabGroup = this._tabGroup;
				if (tabGroup) {
					if (tabGroup.activeTab === this) {
						navGroup._reset();
					} else {
						tabGroup.activeTab = this;
					}
				}
			});
		},

		_defaultWidth: UI_FILL,

		_defaultHeight: UI_FILL,

		open: function(win, options) {
			this._tabNavigationGroup.open(win, options);
		},

		close: function(win, options) {
			this._tabNavigationGroup.close(win, options);
		},

		_focus: function() {
			this.fireEvent("focus", this._tabGroup._getEventData());
			var win = this._tabNavigationGroup._getTopWindow();
			if (win) {
				if (this._tabGroup && this._tabGroup._opened && !win._opened) {
					win._opened = 1;
					win.fireEvent("open");
				}
				win._handleFocusEvent();
			}
		},

		_blur: function() {
			var win = this._tabNavigationGroup._getTopWindow();
			win && win._handleBlurEvent();
			this.fireEvent("blur", this._tabGroup._getEventData());
		},

		_getTitle: function() {
			return Locale._getString(this.titleid, this.title);
		},

		_setTabGroup: function(tabGroup) {
			this._tabGroup = tabGroup;
			this._tabNavigationGroup.navBarAtTop = tabGroup.tabsAtTop;
			this._win && (this._win.tabGroup = tabGroup);
		},

		_setNavBarAtTop: function(value) {
			this._tabNavigationGroup.navBarAtTop = value;
		},

		properties: {
			active: {
				get: function() {
					return this._tabGroup && this._tabGroup.activeTab === this;
				},
				post: function(value) {
					var tabGroup = this._tabGroup,
						navGroup = this._tabNavigationGroup,
						doEvents = tabGroup._focused && tabGroup._opened;
					if (value) {
						navGroup.navBarAtTop = tabGroup.tabsAtBottom;
						navGroup._updateNavBar();
						tabGroup._addTabContents(navGroup);
						doEvents && this._focus();
					} else {
						tabGroup._removeTabContents(navGroup);
						doEvents && this._blur();
					}
				}
			},

			icon: {
				set: function(value) {
					return this._tabIcon.image = value;
				}
			},

			title: postTitle,

			titleid: postTitle
		}

	});

});

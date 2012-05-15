define(["Ti/_/declare", "Ti/UI/View", "Ti/_/dom", "Ti/Locale", "Ti/UI", "Ti/UI/MobileWeb"],
	function(declare, View, dom, Locale, UI, MobileWeb) {

	var postTitle = {
			post: function() {
				this._tabTitle.text = this._getTitle();
			}
		},
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

			container.add(this._tabIcon = UI.createImageView({
				height: UI_SIZE,
				width: UI_SIZE
			}));

			container.add(this._tabTitle = UI.createLabel({
				width: "100%",
				wordWrap: true,
				textAlign: UI.TEXT_ALIGNMENT_CENTER
			}));

			win && require.on(this, "singletap", this, function(e) {
				var tg = this._tabGroup;
				if (tg) {
					if (tg.activeTab === this) {
						navGroup._reset();
					} else {
						tg.activeTab = this;
					}
				}
			});
		},

		_defaultWidth: UI.FILL,

		_defaultHeight: UI.FILL,

		open: function(win, options) {
			this._tabNavigationGroup.open(win, options);
		},

		close: function(win, options) {
			this._tabNavigationGroup.close(win, options);
		},

		_getTitle: function() {
			return Locale._getString(this.titleid, this.title);
		},

		_setTabGroup: function(tg) {
			this._tabGroup = tg;
			this._tabNavigationGroup.navBarAtTop = tg.tabsAtTop;
			this._win && (this._win.tabGroup = tg);
		},

		properties: {
			active: {
				get: function(value) {
					return this._tabGroup && this._tabGroup.activeTab === this;
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

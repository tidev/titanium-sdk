define(["Ti/_/declare", "Ti/UI/View", "Ti/_/dom", "Ti/Locale", "Ti/UI"],
	function(declare, View, dom, Locale, UI) {

	var postTitle = {
		post: "_setTitle"
	};

	return declare("Ti.UI.Tab", View, {

		constructor: function(args) {
			if (!args || !args.window) {
				throw "Invalid arguments: missing window in tab constructor";
			}

			var win = this._win = args.window,
				container = UI.createView({
					layout: "vertical",
					width: "100%",
					height: UI.SIZE
				});

			this._add(container);

			container.add(this._tabIcon = UI.createImageView({
				height: UI.SIZE,
				width: UI.SIZE
			}));

			container.add(this._tabTitle = UI.createLabel({
				width: "100%",
				wordWrap: true,
				textAlign: UI.TEXT_ALIGNMENT_CENTER
			}));

			require.on(this, "singletap", this, function(e) {
				this._tabGroup && (this._tabGroup.activeTab = this);
			});

			win.tab = this;
			win.tabGroup = this._tabGroup;

			this._tabNavigationGroup = UI.MobileWeb.createNavigationGroup({ window: win });
		},

		_defaultWidth: UI.FILL,

		_defaultHeight: UI.FILL,

		open: function(win, options) {
			win.tab = this;
			win.tabGroup = this._tabGroup;
			this._tabNavigationGroup.open(win, options);
		},

		close: function(win, options) {
			this._tabNavigationGroup.close(win, options);
		},

		_setTitle: function() {
			this._tabTitle.text = Locale._getString(this.titleid, this.title);
		},

		_setTabGroup: function(tg) {
			this._tabGroup = tg;
			this._tabNavigationGroup.navBarAtTop = tg.tabsAtTop;
			this._win.tabGroup = tg;
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

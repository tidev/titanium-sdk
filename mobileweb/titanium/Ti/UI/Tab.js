define(["Ti/_/declare", "Ti/UI/View", "Ti/_/dom", "Ti/Locale", "Ti/UI"],
	function(declare, View, dom, Locale, UI) {

	var postTitle = {
		post: "_setTitle"
	};

	return declare("Ti.UI.Tab", View, {

		constructor: function(args) {
			var container = this._contentContainer = dom.create("div", {
				className: "TiUITabContentContainer",
				style: {
					display: ["-webkit-box", "-moz-box"],
					boxOrient: "vertical",
					boxPack: "center",
					boxAlign: "center"
				}
			}, this.domNode);

			this._tabIcon = dom.create("img", {
				className: "TiUITabImage"
			}, container);

			this._tabTitle = dom.create("div", {
				className: "TiUITabTitle",
				style: {
					whiteSpace: "nowrap",
					pointerEvents: "none",
					userSelect: "none"
				}
			}, container);

			var self = this;
			this.addEventListener("singletap", function(e) {
				self._tabGroup && self._tabGroup.setActiveTab(self);
			});
		},

		_defaultWidth: UI.FILL,

		_defaultHeight: UI.FILL,

		_tabGroup: null,

		_tabNavigationGroup: null,

		open: function(win, options) {
			if (this._tabNavigationGroup) {
				this._tabNavigationGroup.open(win, options);
			} else {
				this.window = win;
			}
		},

		close: function(win, options) {
			this._tabNavigationGroup.close(win, options);
		},

		_setTitle: function() {
			this._tabTitle.innerHTML = Locale._getString(this.titleid, this.title);
		},

		properties: {
			active: {
				get: function(value) {
					return this._tabGroup && this._tabGroup.activeTab === this;
				}
			},

			icon: {
				set: function(value) {
					return this._tabIcon.src = value;
				}
			},

			title: postTitle,

			titleid: postTitle,

			window: {
				set: function(value) {
					var tabGroup = this._tabGroup;
					this._tabNavigationGroup = UI.MobileWeb.createNavigationGroup({
						window: value,
						navBarAtTop: tabGroup && tabGroup.tabsAtTop
					});
					this.active && tabGroup && tabGroup.setActiveTab(this); // Force the new nav group to get attached
					return value;
				}
			}
		}

	});

});

define(["Ti/_/declare", "Ti/_/lang", "Ti/UI/View", "Ti/_/dom", "Ti/Locale", "Ti/UI"],
	function(declare, lang, View, dom, Locale, UI) {

	return declare("Ti.UI.Tab", View, {

		constructor: function(args) {
			this._windows = [];

			this._contentContainer = dom.create("div", {
				className: "TiUITabContentContainer",
				style: {
					width: "100%",
					height: "100%",
					display: ["-webkit-box", "-moz-box"],
					boxOrient: "horizontal",
					boxPack: "center",
					boxAlign: "center"
				}
			}, this.domNode);

			this._tabIcon = dom.create("img", {
				className: "TiUITabImage"
			}, this._contentContainer);

			this._tabTitle = dom.create("div", {
				className: "TiUITabTitle",
				style: {
					whiteSpace: "nowrap"
				}
			}, this._contentContainer);

			require.on(this.domNode, "click", this, function(e) {
				this._tabGroup && this._tabGroup.setActiveTab(this);
			});
		},

		open: function(win, args) {
			if (this._tabGroup) {
				win = win || this.window;
				this._windows.push(win);
				win.activeTab = this;
				this._tabGroup._openWindowInTabContainer(win, args);
			}
		},

		close: function(args) {
			var self = this;
				win = self._windows.pop();
			win && win.animate({opacity: 0, duration: 250}, function(){
				win.close(args);
				if (self._windows.length === 0) {
					self._tabGroup._closeLastWindow();
				}
			});
		},

		_defaultWidth: UI.FILL,
		
		_defaultHeight: UI.FILL,
		
		_tabGroup: null,

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

			title: {
				set: function(value) {
					return this._tabTitle.innerHTML = value;
				}
			},

			titleid: {
				set: function(value) {
					this.title = Locale.getString(value);
					return value;
				}
			},

			window: {
				get: function(value) {
					var w = this._windows;
					return value ? value : w.length ? w[0] : null;
				},
				set: function(value) {
					this._windows.unshift(value);
					return value;
				}
			}
		}

	});

});

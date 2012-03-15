define(["Ti/_/declare", "Ti/_/lang", "Ti/UI/View", "Ti/_/dom", "Ti/Locale", "Ti/UI"],
	function(declare, lang, View, dom, Locale, UI) {
		
	var undef;

	return declare("Ti.UI.Tab", View, {

		constructor: function(args) {

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
					whiteSpace: "nowrap",
					pointerEvents: "none",
					userSelect: "none"
				}
			}, this._contentContainer);

			require.on(this.domNode, "click", this, function(e) {
				this._tabGroup && this._tabGroup.setActiveTab(this);
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
				set: function(value) {
					var tabGroup = this._tabGroup,
						navBarAtTop = tabGroup ? tabGroup.tabsAtTop : undef;
					this._tabNavigationGroup = UI.MobileWeb.createNavigationGroup({
						window: value,
						navBarAtTop: navBarAtTop
					});
					this.active && tabGroup.setActiveTab(this); // Force the new nav group to get attached
					return value;
				}
			}
		}

	});

});

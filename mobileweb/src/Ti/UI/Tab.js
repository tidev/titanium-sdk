define("Ti/UI/Tab", ["Ti/_/declare", "Ti/_/lang", "Ti/_/UI/SuperView", "Ti/_/dom", "Ti/_/css", "Ti/_/style"], function(declare, lang, SuperView, dom, css, style) {

	var set = style.set,
		undef;

	return declare("Ti.UI.Tab", SuperView, {
		
		constructor: function(args) {
			
			this._contentContainer = dom.create("div", {
				className: "TiUIButtonContentContainer"
			});
			this.domNode.appendChild(this._contentContainer)
			set(this._contentContainer, "display", "-webkit-box");
			set(this._contentContainer, "width", "100%");
			set(this._contentContainer, "height", "100%");
			set(this._contentContainer, {
				display: "-moz-box",
				boxOrient: "horizontal",
				boxPack: "center",
				boxAlign: "center"
			});
			
			this._tabIcon = dom.create("img", {
				className: "TiUIButtonImage"
			});
			this._contentContainer.appendChild(this._tabIcon);
			
			this._tabTitle = dom.create("div", {
				className: "TiUIButtonTitle"
			});
			set(this._tabTitle,"whiteSpace","nowrap");
			this._contentContainer.appendChild(this._tabTitle);
			
			this.domNode.addEventListener("click",lang.hitch(this,function(e){
				this._tabGroup && this._tabGroup.setActiveTab(this);
			}));
		},

		_defaultWidth: "auto",
		_defaultHeight: "auto",
		_tabGroup: null,
		_tabWidth: "100%",
		
		properties: {
			active: {
				get: function(value) {
					return this._tabGroup ? this._tabGroup.activeTab === this : false;
				},
				set: function(value) {
					return this._tabGroup ? this._tabGroup.activeTab === this : false;
				}
			},
			
			icon: {
				set: function(value) {
					this._tabIcon.src = value;
					return value;
				}
			},
			
			title: {
				set: function(value) {
					this._tabTitle.innerHTML = value;
					return value;
				}
			},
			
			titleid: {
				get: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.Tab#.titleid" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Titanium.UI.Tab#.titleid" is not implemented yet.');
					return value;
				}
			},
			
			"window": undef,
			
			// Override width and height
			width: function(value) {
				return this._tabWidth;
			},
			
			// Override width and height
			height: function(value) {
				return "100%";
			}
		}

	});

});

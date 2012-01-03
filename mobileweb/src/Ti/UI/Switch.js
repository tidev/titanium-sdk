define("Ti/UI/Switch", ["Ti/_/declare", "Ti/_/UI/Widget", "Ti/_/dom", "Ti/_/css", "Ti/_/style"], function(declare, Widget, dom, css, style) {

	var set = style.set,
        undef;

	return declare("Ti.UI.Switch", Widget, {

		constructor: function(args) {
			this._switch = dom.create("input", {
				className: css.clean("TiUISwitchSwitch")
			});
			set(this._switch,"width","100%");
			set(this._switch,"height","100%");
			this._switch.type = "checkbox";
			this.domNode.appendChild(this._switch);
		},

		properties: {
			_defaultWidth: "auto",
            _defaultHeight: "auto",
		
			_contentWidth: {
				get: function(value) {
					return this._switch.clientWidth;
				},
				set: function(value) {
					return this._switch.clientWidth;
				}
			},
			
			_contentHeight: {
				get: function(value) {
					return this.textArea.clientHeight;
				},
				set: function(value) {
					return this.textArea.clientHeight;
				}
			},
            
            title: {
				get: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.Switch#.title" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Titanium.UI.Switch#.title" is not implemented yet.');
					return value;
				}
			},
			
            titleOff: {
				get: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.Switch#.titleOff" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Titanium.UI.Switch#.titleOff" is not implemented yet.');
					return value;
				}
			},
			
            titleOn: {
				get: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.Switch#.titleOn" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Titanium.UI.Switch#.titleOn" is not implemented yet.');
					return value;
				}
			},
			
            value: {
				get: function(value) {
					return this.switch.value;
				},
				set: function(value) {
					this.switch.value = value ? true : false
					return this.switch.value;
				}
			}
		}

	});

});

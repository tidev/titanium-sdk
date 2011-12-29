define("Ti/UI/Switch", ["Ti/_/declare", "Ti/_/UI/Widget"], function(declare, Widget) {

	return declare("Ti.UI.Switch", Widget, {

		constructor: function(args) {
			this.switch = dom.create("input", {
				className: css.clean("TiUISwitchSwitch")
			});
			this.switch.type = "checkbox";
			this.domNode.appendChild(this.switch);
		},

		properties: {
			_defaultWidth: "auto",
            _defaultHeight: "auto",
            
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

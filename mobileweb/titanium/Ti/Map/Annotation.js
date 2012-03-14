define(["Ti/_/declare", "Ti/_/Evented", "Ti/Locale"], function(declare, Evented, Locale) {

	var undef;

	return declare("Ti.Map.Annotation", Evented, {

		constructor: function() {
			// wire up click event
		},

		properties: {
			animate: false,
			image: undef,		// string or Titanium.Blob
			latitude: undef,	// number
			longitude: undef,	// number
			leftButton: undef,	// number or string
			leftView: undef,	// Ti.UI.View
			rightButton: undef,	// number or string
			rightView: undef,	// Ti.UI.View
			subtitle: undef,	// string
			subtitleid: {
				set: function(value) {
					this.subtitle = Locale.getString(value);
					return value;
				}
			}
			title: undef,
			titleid: {
				set: function(value) {
					this.title = Locale.getString(value);
					return value;
				}
			}
		}

	});

});

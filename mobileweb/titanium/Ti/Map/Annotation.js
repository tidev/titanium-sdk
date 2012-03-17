define(["Ti/_/declare", "Ti/_/Evented", "Ti/Locale"], function(declare, Evented, Locale) {

	var undef;

	return declare("Ti.Map.Annotation", Evented, {

		onclick: function(mapview, idx, src) {
			this.fireEvent("click", {
				index: idx,
				title: this.title,
				map: mapview,
				clicksource: src,
				annotation: this
			});
		},

		properties: {
			animate: false,
			image: undef,		// string or Titanium.Blob
			latitude: undef,	// number
			longitude: undef,	// number
			leftButton: undef,	// number or string
			leftView: undef,	// Ti.UI.View
			pincolor: undef,	// ANNOTATION_RED or ANNOTATION_PURPLE or ANNOTATION_GREEN
			rightButton: undef,	// number or string
			rightView: undef,	// Ti.UI.View
			subtitle: undef,	// string
			subtitleid: {
				set: function(value) {
					this.subtitle = Locale.getString(value);
					return value;
				}
			},
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

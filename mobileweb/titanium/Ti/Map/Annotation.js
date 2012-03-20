define(["Ti/_/declare", "Ti/_/Evented", "Ti/Locale"], function(declare, Evented, Locale) {

	return declare("Ti.Map.Annotation", Evented, {

		_onclick: function(mapview, idx, src) {
			// TODO: mixin custom props

			this.fireEvent("click", {
				annotation: this,
				clicksource: src,
				index: idx,
				map: mapview,
				title: this.title
			});
		},

		_getTitle: function() {
			return Locale._getString(this.titleid, this.title);
		},

		_getSubtitle: function() {
			return Locale._getString(this.subtitleid, this.subtitle);
		},

		properties: {
			animate: false,
			image: void 0,			// string or Titanium.Blob
			latitude: void 0,		// number
			longitude: void 0,		// number
			leftButton: void 0,		// number or string
			leftView: void 0,		// Ti.UI.View
			pincolor: void 0,		// ANNOTATION_RED or ANNOTATION_PURPLE or ANNOTATION_GREEN
			rightButton: void 0,	// number or string
			rightView: void 0,		// Ti.UI.View
			subtitle: void 0,		// string
			subtitleid: void 0,
			title: void 0,
			titleid: void 0
		}

	});

});

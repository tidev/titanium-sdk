define(["Ti/_/declare", "Ti/_/Evented", "Ti/Locale"], function(declare, Evented, Locale) {

	var updateHook = {
		post: function(newValue, oldValue, prop) {
			this.fireEvent("update", {
				property: prop,
				value: newValue,
				oldValue: oldValue
			});
		}
	};

	return declare("Ti.Map.Annotation", Evented, {

		_onclick: function(mapview, idx, src) {
			this.fireEvent("click", {
				annotation: this,
				clicksource: src,
				index: idx,
				map: mapview,
				title: this.title
			});
		},

		_update: function() {},

		_getTitle: function() {
			return Locale._getString(this.titleid, this.title);
		},

		_getSubtitle: function() {
			return Locale._getString(this.subtitleid, this.subtitle);
		},

		properties: {
			animate: false,
			image: updateHook,
			latitude: updateHook,
			longitude: updateHook,
			leftButton: updateHook,
			pincolor: updateHook,
			rightButton: updateHook,
			subtitle: updateHook,
			subtitleid: updateHook,
			title: updateHook,
			titleid: updateHook
		}

	});

});

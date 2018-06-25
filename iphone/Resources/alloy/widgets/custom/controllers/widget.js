'use strict';

function Controller(properties) {
	var label = Ti.UI.createLabel(properties);
	this.getView = function () {
		return label;
	};
}
module.exports = Controller;

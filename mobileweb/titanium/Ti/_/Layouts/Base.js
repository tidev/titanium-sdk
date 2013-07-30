/*global define*/
define(['Ti/_/css', 'Ti/_/declare', 'Ti/_/style', 'Ti/_/lang', 'Ti/API', 'Ti/UI', 'Ti/_', 'Ti/_/dom'],
	function(css, declare, style, lang, API, UI, _, dom) {

	return declare('Ti._.Layouts.Base', null, {

		computedSize: {width: 0, height: 0},

		constructor: function(args) {
			css.add(args.element.domNode, css.clean(this.declaredClass));
		},

		destroy: function() {
			css.remove(this.element.domNode, css.clean(this.declaredClass));
		},

		handleInvalidState: function(child, parent) {
			API.debug('WARNING: Attempting to layout element that has been destroyed.\n\t Removing the element from the parent.\n\t The parent has a widget ID of ' + parent.widgetId + '.');
			var children = parent._children;
			children.splice(children.indexOf(child),1);
		},

		getValueType: function(value) {
			if (value !== void 0) {
				if (value === UI.SIZE || value === UI.FILL) {
					return value;
				}
				return ~(value + '').indexOf('%') ? '%' : '#';
			}
		},

		/*
		calculateAnimation: function(node, animation) {
			var val = lang.val,
				animationCoefficients = node._animationCoefficients,
				center,
				results,
				pixelUnits = 'px';

			(node.center || animation.center) && (center = {});
			if (center) {
				center.x = val(animation.center && animation.center.x, node.center && node.center.x);
				center.y = val(animation.center && animation.center.y, node.center && node.center.y);
			}

			!animationCoefficients && (animationCoefficients = node._animationCoefficients = {
				width: {},
				minWidth: {},
				sandboxWidth: {},
				height: {},
				minHeight: {},
				sandboxHeight: {},
				left: {},
				top: {}
			});

			this._measureNode(node, {
				left: val(animation.left,node.left),
				right: val(animation.right,node.right),
				top: val(animation.top,node.top),
				bottom: val(animation.bottom,node.bottom),
				center: center,
				width: val(animation.width,node.width),
				minWidth: node.minWidth,
				minHeight: node.minHeight,
				height: val(animation.height,node.height)
			},animationCoefficients, this);

			results = this._doAnimationLayout(node, animationCoefficients);

			style.set(node.domNode, {
				zIndex: node.zIndex | 0,
				left: Math.round(results.left) + pixelUnits,
				top: Math.round(results.top) + pixelUnits,
				width: Math.round(results.width - node._borderLeftWidth - node._borderRightWidth) + pixelUnits,
				height: Math.round(results.height - node._borderTopWidth - node._borderBottomWidth) + pixelUnits
			});
		},
		*/

		calculateAnimation: function(elem, animation) {
			var val = lang.val,
				animationCoefficients = elem._animationCoefficients || (elem._animationCoefficients = {
					height: {},
					left: {},
					minWidth: {},
					sandboxWidth: {},
					minHeight: {},
					sandboxHeight: {},
					top: {},
					width: {}
				}),
				results = {};

			this._measureNode(elem, {
				left: val(animation.left, elem.left),
				right: val(animation.right, elem.right),
				top: val(animation.top, elem.top),
				bottom: val(animation.bottom, elem.bottom),
				center: (elem.center || animation.center) && {
					x: val(animation.center && animation.center.x, elem.center && elem.center.x),
					y: val(animation.center && animation.center.y, elem.center && elem.center.y)
				},
				width: val(animation.width, elem.width),
				minWidth: elem.minWidth,
				minHeight: elem.minHeight,
				height: val(animation.height, elem.height)
			}, animationCoefficients, this);

			results = this._doAnimationLayout(elem, animationCoefficients);

			return {
				left: results.left,
				top: results.top,
				width: results.width - elem._borderLeftWidth - elem._borderRightWidth,
				height: results.height - elem._borderTopWidth - elem._borderBottomWidth
			};
		},

		computeValue: function(dimension, valueType) {
			if (valueType === '%') {
				return parseFloat(dimension) / 100;
			}
			if (valueType === '#') {
				return dom.computeSize(dimension);
			}
		}

	});

});
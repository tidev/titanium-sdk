/*jslint devel: true, bitwise: true, regexp: true, browser: true, confusion: true, unparam: true, eqeq: true, white: true, nomen: true, plusplus: true, maxerr: 50, indent: 4 */
/*globals jQuery */

/*
 * ColorPicker v0.6
 *
 * Copyright (c) 2011 Martijn W. van der Lee
 * Licensed under the MIT.
 *
 * Full-featured colorpicker for jQueryUI with full theming support.
 * Most images from jPicker by Christopher T. Tillman.
 * Sourcecode created from scratch by Martijn W. van der Lee.
 *
 * @todo Custom buttons ->none" -> special "none" state?
 * @todo Undo/redo memory?
 * @todo Small size variant (128x128)
 * @todo Distance between rgb/hsv/a options
 * @todo Force hex correction (limit and padding) upon done
 * @todo if limit, correct initial color upon open
 * @todo Shared swatches; cookies/session/global
 * @todo Language files: Done/Color/Pick a color/H/S/V/R/G/B/A/color swatches
 * @todo isRTL? What to RTL, besides button?
 * @todo Implement 'disabled' option
 * @todo Include header/footer in layout?
 * @todo Split inputs into rgb/hsv/a parts
 * @todo Modal popup mode
 */

(function ($) {
	"use strict";

	var _container_popup = '<div class="ui-colorpicker ui-colorpicker-dialog ui-dialog ui-widget ui-widget-content ui-corner-all colorpicker-container" style="display: none;"></div>',

		_container_inline = '<div class="ui-colorpicker ui-colorpicker-inline ui-dialog ui-widget ui-widget-content ui-corner-all"></div>',

		_parts_lists = {
			'full':		['header', 'map', 'bar', 'hex', 'inputs', 'preview', 'swatches', 'footer'],
			'popup':	['map', 'bar', 'hex', 'inputs', 'preview', 'footer'],
			'inline':	['map', 'bar', 'hex', 'inputs', 'preview']
		},

		_colors = {
			'Black': [0x00, 0x00, 0x00],
			'DimGray': [0x69, 0x69, 0x69],
			'Gray': [0x80, 0x80, 0x80],
			'DarkGray': [0xA9, 0xA9, 0xA9],
			'Silver': [0xC0, 0xC0, 0xC0],
			'LightGrey': [0xD3, 0xD3, 0xD3],
			'Gainsboro': [0xDC, 0xDC, 0xDC],
			'WhiteSmoke': [0xF5, 0xF5, 0xF5],
			'White': [0xFF, 0xFF, 0xFF],
			'RosyBrown': [0xBC, 0x8F, 0x8F],
			'IndianRed': [0xCD, 0x5C, 0x5C],
			'Brown': [0xA5, 0x2A, 0x2A],
			'FireBrick': [0xB2, 0x22, 0x22],
			'LightCoral': [0xF0, 0x80, 0x80],
			'Maroon': [0x80, 0x00, 0x00],
			'DarkRed': [0x8B, 0x00, 0x00],
			'Red': [0xFF, 0x00, 0x00],
			'Snow': [0xFF, 0xFA, 0xFA],
			'Salmon': [0xFA, 0x80, 0x72],
			'MistyRose': [0xFF, 0xE4, 0xE1],
			'Tomato': [0xFF, 0x63, 0x47],
			'DarkSalmon': [0xE9, 0x96, 0x7A],
			'OrangeRed': [0xFF, 0x45, 0x00],
			'Coral': [0xFF, 0x7F, 0x50],
			'LightSalmon': [0xFF, 0xA0, 0x7A],
			'Sienna': [0xA0, 0x52, 0x2D],
			'Seashell': [0xFF, 0xF5, 0xEE],
			'Chocolate': [0xD2, 0x69, 0x1E],
			'SaddleBrown': [0x8B, 0x45, 0x13],
			'SandyBrown': [0xF4, 0xA4, 0x60],
			'PeachPuff': [0xFF, 0xDA, 0xB9],
			'Peru': [0xCD, 0x85, 0x3F],
			'Linen': [0xFA, 0xF0, 0xE6],
			'DarkOrange': [0xFF, 0x8C, 0x00],
			'Bisque': [0xFF, 0xE4, 0xC4],
			'BurlyWood': [0xDE, 0xB8, 0x87],
			'Tan': [0xD2, 0xB4, 0x8C],
			'AntiqueWhite': [0xFA, 0xEB, 0xD7],
			'NavajoWhite': [0xFF, 0xDE, 0xAD],
			'BlanchedAlmond': [0xFF, 0xEB, 0xCD],
			'PapayaWhip': [0xFF, 0xEF, 0xD5],
			'Orange': [0xFF, 0xA5, 0x00],
			'Moccasin': [0xFF, 0xE4, 0xB5],
			'Wheat': [0xF5, 0xDE, 0xB3],
			'OldLace': [0xFD, 0xF5, 0xE6],
			'FloralWhite': [0xFF, 0xFA, 0xF0],
			'Goldenrod': [0xDA, 0xA5, 0x20],
			'DarkGoldenrod': [0xB8, 0x86, 0x0B],
			'Cornsilk': [0xFF, 0xF8, 0xDC],
			'Gold': [0xFF, 0xD7, 0x00],
			'PaleGoldenrod': [0xEE, 0xE8, 0xAA],
			'Khaki': [0xF0, 0xE6, 0x8C],
			'LemonChiffon': [0xFF, 0xFA, 0xCD],
			'DarkKhaki': [0xBD, 0xB7, 0x6B],
			'Beige': [0xF5, 0xF5, 0xDC],
			'LightGoldenrodYellow': [0xFA, 0xFA, 0xD2],
			'Olive': [0x80, 0x80, 0x00],
			'Yellow': [0xFF, 0xFF, 0x00],
			'LightYellow': [0xFF, 0xFF, 0xE0],
			'Ivory': [0xFF, 0xFF, 0xF0],
			'OliveDrab': [0x6B, 0x8E, 0x23],
			'YellowGreen': [0x9A, 0xCD, 0x32],
			'DarkOliveGreen': [0x55, 0x6B, 0x2F],
			'GreenYellow': [0xAD, 0xFF, 0x2F],
			'LawnGreen': [0x7C, 0xFC, 0x00],
			'Chartreuse': [0x7F, 0xFF, 0x00],
			'DarkSeaGreen': [0x8F, 0xBC, 0x8F],
			'ForestGreen': [0x22, 0x8B, 0x22],
			'LimeGreen': [0x32, 0xCD, 0x32],
			'LightGreen': [0x90, 0xEE, 0x90],
			'PaleGreen': [0x98, 0xFB, 0x98],
			'DarkGreen': [0x00, 0x64, 0x00],
			'Green': [0x00, 0x80, 0x00],
			'Lime': [0x00, 0xFF, 0x00],
			'Honeydew': [0xF0, 0xFF, 0xF0],
			'MediumSeaGreen': [0x3C, 0xB3, 0x71],
			'SeaGreen': [0x2E, 0x8B, 0x57],
			'SpringGreen': [0x00, 0xFF, 0x7F],
			'MintCream': [0xF5, 0xFF, 0xFA],
			'MediumSpringGreen': [0x00, 0xFA, 0x9A],
			'MediumAquamarine': [0x66, 0xCD, 0xAA],
			'Aquamarine': [0x7F, 0xFF, 0xD4],
			'Turquoise': [0x40, 0xE0, 0xD0],
			'LightSeaGreen': [0x20, 0xB2, 0xAA],
			'MediumTurquoise': [0x48, 0xD1, 0xCC],
			'DarkSlateGray': [0x2F, 0x4F, 0x4F],
			'PaleTurquoise': [0xAF, 0xEE, 0xEE],
			'Teal': [0x00, 0x80, 0x80],
			'DarkCyan': [0x00, 0x8B, 0x8B],
			'DarkTurquoise': [0x00, 0xCE, 0xD1],
			'Aqua': [0x00, 0xFF, 0xFF],
			'Cyan': [0x00, 0xFF, 0xFF],
			'LightCyan': [0xE0, 0xFF, 0xFF],
			'Azure': [0xF0, 0xFF, 0xFF],
			'CadetBlue': [0x5F, 0x9E, 0xA0],
			'PowderBlue': [0xB0, 0xE0, 0xE6],
			'LightBlue': [0xAD, 0xD8, 0xE6],
			'DeepSkyBlue': [0x00, 0xBF, 0xFF],
			'SkyBlue': [0x87, 0xCE, 0xEB],
			'LightSkyBlue': [0x87, 0xCE, 0xFA],
			'SteelBlue': [0x46, 0x82, 0xB4],
			'AliceBlue': [0xF0, 0xF8, 0xFF],
			'DodgerBlue': [0x1E, 0x90, 0xFF],
			'SlateGray': [0x70, 0x80, 0x90],
			'LightSlateGray': [0x77, 0x88, 0x99],
			'LightSteelBlue': [0xB0, 0xC4, 0xDE],
			'CornflowerBlue': [0x64, 0x95, 0xED],
			'RoyalBlue': [0x41, 0x69, 0xE1],
			'MidnightBlue': [0x19, 0x19, 0x70],
			'Lavender': [0xE6, 0xE6, 0xFA],
			'Navy': [0x00, 0x00, 0x80],
			'DarkBlue': [0x00, 0x00, 0x8B],
			'MediumBlue': [0x00, 0x00, 0xCD],
			'Blue': [0x00, 0x00, 0xFF],
			'GhostWhite': [0xF8, 0xF8, 0xFF],
			'DarkSlateBlue': [0x48, 0x3D, 0x8B],
			'SlateBlue': [0x6A, 0x5A, 0xCD],
			'MediumSlateBlue': [0x7B, 0x68, 0xEE],
			'MediumPurple': [0x93, 0x70, 0xDB],
			'BlueViolet': [0x8A, 0x2B, 0xE2],
			'Indigo': [0x4B, 0x00, 0x82],
			'DarkOrchid': [0x99, 0x32, 0xCC],
			'DarkViolet': [0x94, 0x00, 0xD3],
			'MediumOrchid': [0xBA, 0x55, 0xD3],
			'Thistle': [0xD8, 0xBF, 0xD8],
			'Plum': [0xDD, 0xA0, 0xDD],
			'Violet': [0xEE, 0x82, 0xEE],
			'Purple': [0x80, 0x00, 0x80],
			'DarkMagenta': [0x8B, 0x00, 0x8B],
			'Magenta': [0xFF, 0x00, 0xFF],
			'Fuchsia': [0xFF, 0x00, 0xFF],
			'Orchid': [0xDA, 0x70, 0xD6],
			'MediumVioletRed': [0xC7, 0x15, 0x85],
			'DeepPink': [0xFF, 0x14, 0x93],
			'HotPink': [0xFF, 0x69, 0xB4],
			'PaleVioletRed': [0xDB, 0x70, 0x93],
			'LavenderBlush': [0xFF, 0xF0, 0xF5],
			'Crimson': [0xDC, 0x14, 0x3C],
			'Pink': [0xFF, 0xC0, 0xCB],
			'LightPink': [0xFF, 0xB6, 0xC1]
		};

	$.widget("vanderlee.colorpicker", {
		options: {
			alpha:				false,		// Show alpha controls and mode
			altAlpha:			true,		// change opacity of altField as well?
			altField:			'',			// selector for DOM elements which change background color on change.
			altOnChange:		true,		// true to update on each change, false to update only on close.
			altProperties:		'background-color',	// comma separated list of any of 'background-color', 'color', 'border-color', 'outline-color'
			autoOpen:			false,		// Open dialog automatically upon creation
			buttonColorize:		false,
			buttonImage:		'images/ui-colorpicker.png',
			buttonImageOnly:	false,
			buttonText:			'Color',	// Text on the button and/or title of button image.
			closeOnOutside:		true,		// Close the dialog when clicking outside the dialog (not for inline)
			color:				'#00FF00',	// Initial color (for inline only)
			duration:			'fast',
			hsv:				true,		// Show HSV controls and modes
			layout: {
				map:		[0, 0, 1, 3],	// Left, Top, Width, Height (in table cells).
				bar:		[1, 0, 1, 3],
				preview:	[2, 0, 1, 1],
				inputs:		[2, 1, 1, 1],
				hex:		[2, 2, 1, 1],
				swatches:	[3, 0, 1, 3]
			},
			limit:				'',			// Limit color "resolution": '', 'websafe', 'nibble', 'binary'
			mode:				'h',		// Initial editing mode, h, s, v, r, g, b or a
			parts:				'',
			rgb:				true,		// Show RGB controls and modes
			showAnim:			'fadeIn',
			showOn:				'focus',	// 'focus', 'button', 'both'
			showOptions:		{},
			swatches:			null,
			title:				'Pick a color',

			onClose:			null,
			onSelect:			null
		},

		_create: function () {
			var self = this;

			self.opened		= false;
			self.generated	= false;
			self.inline		= false;
			self.changed	= false;

			self.dialog		= null;
			self.button		= null;
			self.image		= null;

			self.mode		= self.options.mode;

			if (self.options.swatches === null) {
				self.options.swatches = _colors;
			}

			if (this.element[0].nodeName.toLowerCase() === 'input') {
				if (self.element.val()) {
					self.options.color = self.element.val();
				}
				self._loadColor();

				$('body').append(_container_popup);
				self.dialog = $('.ui-colorpicker:last');

				// Click outside/inside
				$(document).mousedown(function (event) {
					if (!self.opened || event.target === self.element[0]) {
						return;
					}

					// Check if clicked on any part of dialog
					if ($(event.target).parents('.ui-colorpicker').length > 0) {
						self.element.blur();	// inside window!
						return;
					}

					// Check if clicked on button
					var p,
						parents = $(event.target).parents();
					for (p in parents) {
						if (self.button !== null && parents[p] === self.button[0]) {
							return;
						}
					}

					// no closeOnOutside
					if (!self.options.closeOnOutside) {
						return;
					}

					self.close();
				});

				if (self.options.showOn === 'focus' || self.options.showOn === 'both') {
					self.element.focus(function () {
						self.open();
					});
				}
				if (self.options.showOn === 'button' || self.options.showOn === 'both') {
					if (self.options.buttonImage !== '') {
						self.image = $('<img/>').attr({
							'src':		self.options.buttonImage,
							'alt':		self.options.buttonText,
							'title':	self.options.buttonText
						});

						if (self.options.buttonColorize) {
							self.image.css('background-color', self.color.toCSS());
						}
					}

					if (self.options.buttonImageOnly && self.image) {
						self.button = self.image;
					} else {
						self.button = $('<button type="button"></button>').html(self.image || self.options.buttonText).button();
						self.image = self.image ? $('img', self.button).first() : null;
					}
					self.button.insertAfter(self.element).click(function () {
						self[self.opened ? 'close' : 'open']();
					});
				}

				if (self.options.autoOpen) {
					self.open();
				}

				self.element.keydown(function (event) {
					if (event.keyCode === 9) {
						self.close();
					}
				});

				self.element.keyup(function (event) {
					var rgb = self._parseHex(self.element.val());
					if (rgb) {
						self.color = (rgb === false ? new self.Color() : new self.Color(rgb[0], rgb[1], rgb[2]));
						self._change();
					}
				});
			} else {
				self.inline = true;

				$(this.element).html(_container_inline);
				self.dialog = $('.ui-colorpicker', this.element);

				self._generate();

				self.opened = true;
			}

			return this;
		},

		destroy: function() {
			this.element.unbind();

			if (this.image !== null) {
				this.image.remove();
			}

			if (this.button !== null) {
				this.button.remove();
			}

			if (this.dialog !== null) {
				this.dialog.remove();
			}
		},

		_setOption: function(key, value){
			var self = this;

			switch (key) {
			case "disabled":
				if (value) {
					self.dialog.addClass('ui-colorpicker-disabled');
				} else {
					self.dialog.removeClass('ui-colorpicker-disabled');
				}
				break;
			}

			$.Widget.prototype._setOption.apply(self, arguments);
		},

		_setAltField: function () {
			if (this.options.altField && this.options.altProperties) {
				var index,
					property,
					properties = this.options.altProperties.split(',');

				for (index in properties) {
					property = $.trim(properties[index]);
					switch (property) {
						case 'color':
						case 'background-color':
						case 'outline-color':
						case 'border-color':
							$(this.options.altField).css(property, this.color.toCSS());
							break;
					}
				}

				if (this.options.altAlpha) {
					$(this.options.altField).css('opacity', this.color.a);
				}
			}
		},

		_loadColor: function () {
			var rgb = this._parseColor(this.options.color);	//@todo
			this.color = (rgb === false ? new this.Color() : new this.Color(rgb[0], rgb[1], rgb[2]));
			this.currentColor = $.extend({}, this.color);

			this._setAltField();
		},

		_generate: function () {
			var self = this,
				index,
				part,
				parts_list;

			// Determine the parts to include in this colorpicker
			if (typeof self.options.parts === 'string') {
				if (self.options.parts in _parts_lists) {
					parts_list = _parts_lists[self.options.parts];
				} else {
					// automatic
					parts_list = _parts_lists[self.inline ? 'inline' : 'popup'];
				}
			} else {
				parts_list = self.options.parts;
			}

			// Add any parts to the internal parts list
			self.parts = {};
			for (index in parts_list) {
				part = parts_list[index];
				if (part in self._parts) {
					self.parts[part] = new self._parts[part](self);
				}
			}


			if (typeof this.color !== "object" || this.color.constructor !== this.Color) {
				self._loadColor();
			}

			if (!self.generated) {
				var layout_parts = [];

				for (index in self.options.layout) {
					if (index in self.parts) {
						layout_parts.push({
							part: index,
							pos: self.options.layout[index]
						});
					}
				}

				$(self._layoutTable(layout_parts, function(cell, x, y) {
					var classes = [];

					if (x > 0) {
						classes.push('ui-colorpicker-padding-left');
					}

					if (y > 0) {
						classes.push('ui-colorpicker-padding-top');
					}

					return '<td id="ui-colorpicker-' + cell.part + '-container"'
						+ (cell.pos[2] > 1 ? ' colspan="' + cell.pos[2] + '"' : '')
						+ (cell.pos[3] > 1 ? ' rowspan="' + cell.pos[3] + '"' : '')
						+ (classes.length > 0 ? ' class="' + classes.join(' ') + '"' : '')
						+ ' valign="top"></td>';
				})).appendTo(self.dialog).addClass('ui-dialog-content ui-widget-content');

				self._initAllParts();
				self._generateAllParts();
				self.generated = true;
			}
		},

		_layoutTable: function(layout, callback) {
			var layout = layout.sort(function(a, b) {
					if (a.pos[1] == b.pos[1]) {
						return a.pos[0] - b.pos[0];
					}
					return a.pos[1] - b.pos[1];
				}),
				bitmap,
				x,
				y,
				width, height,
				columns, rows,
				index,
				cell,
				html;

			// Determine dimensions of the table
			width = 0;
			height = 0;
			for (index in layout) {
				width = Math.max(width, layout[index].pos[0] + layout[index].pos[2]);
				height = Math.max(height, layout[index].pos[1] + layout[index].pos[3]);
			}

			// Initialize bitmap
			bitmap = [];
			for (x = 0; x < width; ++x) {
				bitmap.push(new Array(height));
			}

			// Mark rows and columns which have layout assigned
			rows	= new Array(height);
			columns = new Array(width);
			for (index in layout) {
				// mark columns
				for (x = 0; x < layout[index].pos[2]; x += 1) {
					columns[layout[index].pos[0] + x] = true;
				}
				for (y = 0; y < layout[index].pos[3]; y += 1) {
					rows[layout[index].pos[1] + y] = true;
				}
			}

			// Generate the table
			html = '';
			cell = layout[index = 0];
			for (y = 0; y < height; ++y) {
				html += '<tr>';
				for (x = 0; x < width;) {
					if (cell !== undefined && x == cell.pos[0] && y == cell.pos[1]) {
						// Create a "real" cell
						var w,
							h;

						html += callback(cell, x, y);

						for (h = 0; h < cell.pos[3]; h +=1) {
							for (w = 0; w < cell.pos[2]; w +=1) {
								bitmap[x + w][y + h] = true;
							}
						}

						x += cell.pos[2];
						cell = layout[++index];
					} else {
						// Fill in the gaps
						var colspan = 0;
						var walked = false;

						while (x < width && bitmap[x][y] === undefined && (cell === undefined || y < cell.pos[1] || (y == cell.pos[1] && x < cell.pos[0]))) {
							if (columns[x] === true) {
								colspan += 1;
							}
							walked = true;
							x += 1;
						}

						if (colspan > 0) {
							html += '<td colspan="'+colspan+'"></td>';
						} else if (!walked) {
							x += 1;
						}
					}
				}
				html += '</tr>';
			}

			return '<table cellspacing="0" cellpadding="0" border="0"><tbody>' + html + '</tbody></table>';
		},

		_effectGeneric: function (show, slide, fade, callback) {
			var self = this;

			if ($.effects && $.effects[self.options.showAnim]) {
				self.dialog[show](self.options.showAnim, self.options.showOptions, self.options.duration, callback);
			} else {
				self.dialog[(self.options.showAnim === 'slideDown' ?
								slide
							:	(self.options.showAnim === 'fadeIn' ?
									fade
								:	show))]((self.options.showAnim ? self.options.duration : null), callback);
				if (!self.options.showAnim || !self.options.duration) {
					callback();
				}
			}
		},

		_effectShow: function (callback) {
			this._effectGeneric('show', 'slideDown', 'fadeIn', callback);
		},

		_effectHide: function (callback) {
			this._effectGeneric('hide', 'slideUp', 'fadeOut', callback);
		},

		open: function () {
			if (!this.opened) {
				this._generate();

				var offset = this.element.offset(),
					x = offset.left,
					y = offset.top + this.element.outerHeight();
				x -= Math.max(0, (x + this.dialog.width()) - $(window).width() + 20);
				y -= Math.max(0, (y + this.dialog.height()) - $(window).height() + 20);
				this.dialog.css({'left': x, 'top': y});

				this._effectShow();
				this.opened = true;
			}
		},

		close: function () {
			var self = this;

			this._setAltField();

			self.currentColor	= $.extend({}, self.color);
			self.changed		= false;

			// tear down the interface
			self._effectHide(function () {
				self.dialog.empty();
				self.generated	= false;

				self.opened		= false;
				self._callback(self.options.onClose);
			});
		},

		_callback: function (f) {
			var self = this;

			if (f instanceof Function) {
				f(self.color.toCSS(), {
					r: self.color.r,
					g: self.color.g,
					b: self.color.b,
					a: self.color.a
				}, self);
			}
		},

		_generateAllParts: function () {
			$.each(this.parts, function (index, part) {
				part.generate();
			});
		},

		_initAllParts: function () {
			$.each(this.parts, function (index, part) {
				part.init();
			});
		},

		_change: function () {
			this.changed = true;

			switch (this.options.limit) {
			case 'websafe':
				this.color.limit(6);
				break;

			case 'nibble':
				this.color.limit(16);
				break;

			case 'binary':
				this.color.limit(2);
				break;
			}

			// update colors
			if (!this.inline) {
				if (!this.color.equals(this._parseHex(this.element.val()))) {
					this.element.val(this.color.toHex());
				}

				if (this.image && this.options.buttonColorize) {
					this.image.css('background-color', this.color.toCSS());
				}

				if (this.options.altOnChange) {
					this._setAltField();
				}
			}

			// callback
			this._callback(this.options.onSelect);

			$.each(this.parts, function (index, part) {
				part.repaint();
			});
		},

		_intToHex: function (dec) {
			var result = dec.toString(16);
			if (result.length === 1) {
				result = ('0' + result);
			}
			return result.toLowerCase();
		},

		// This will be deprecated by jQueryUI 1.9 widget
		_hoverable: function (e) {
			e.hover(function () {
				e.addClass("ui-state-hover");
			}, function () {
				e.removeClass("ui-state-hover");
			});
		},

		// This will be deprecated by jQueryUI 1.9 widget
		_focusable: function (e) {
			e.focus(function () {
				e.addClass("ui-state-focus");
			}).blur(function () {
				e.removeClass("ui-state-focus");
			});
		},

		_parts: {
			header: function (inst) {
				var self = this,
					e = null,
					_html;

				_html = function () {
					return '<div class="ui-dialog-titlebar ui-widget-header ui-corner-all ui-helper-clearfix">'
						+ '<span class="ui-dialog-title">' + inst.options.title + '</span>'
						+ '<a href="#" class="ui-dialog-titlebar-close ui-corner-all" role="button">'
						+ '<div class="ui-icon ui-icon-closethick"></div></a></div>';
				};

				this.init = function () {
					e = $(_html()).prependTo(inst.dialog);
					var close = $('.ui-dialog-titlebar-close', e);
					inst._hoverable(close);
					inst._focusable(close);

					close.click( function() {
						inst.close()
					});
				};

				this.repaint = function () {
				};

				this.generate = function () {
					this.repaint();
				};
			},

			map: function (inst) {
				var self	= this,
					e		= null,
					_mousedown, _mouseup, _mousemove, _html;

				_mousedown = function (event) {
					if (!inst.opened) {
						return;
					}

					var div		= $('#ui-colorpicker-map-layer-pointer', e),
						offset	= div.offset(),
						width	= div.width(),
						height	= div.height(),
						x		= event.pageX - offset.left,
						y		= event.pageY - offset.top;

					if (x >= 0 && x < width && y >= 0 && y < height) {
						event.stopImmediatePropagation();
						event.preventDefault();
						$(document).unbind('mousedown', _mousedown);
						$(document).bind('mouseup', _mouseup);
						$(document).bind('mousemove', _mousemove);
						_mousemove(event);
					}
				};

				_mouseup = function (event) {
					event.stopImmediatePropagation();
					event.preventDefault();
					$(document).unbind('mouseup', _mouseup);
					$(document).unbind('mousemove', _mousemove);
					$(document).bind('mousedown', _mousedown);
				};

				_mousemove = function (event) {
					event.stopImmediatePropagation();
					event.preventDefault();

					if (event.pageX === self.x && event.pageY === self.y) {
						return;
					}
					self.x = event.pageX;
					self.y = event.pageY;

					var div = $('#ui-colorpicker-map-layer-pointer', e),
						offset = div.offset(),
						width = div.width(),
						height = div.height(),
						x = event.pageX - offset.left,
						y = event.pageY - offset.top;

					x = Math.max(0, Math.min(x / width, 1));
					y = Math.max(0, Math.min(y / height, 1));

					// interpret values
					switch (inst.mode) {
					case 'h':
						inst.color.s = x;
						inst.color.v = 1 - y;
						inst.color.updateRGB();
						break;

					case 's':
					case 'a':
						inst.color.h = x;
						inst.color.v = 1 - y;
						inst.color.updateRGB();
						break;

					case 'v':
						inst.color.h = x;
						inst.color.s = 1 - y;
						inst.color.updateRGB();
						break;

					case 'r':
						inst.color.b = x;
						inst.color.g = 1 - y;
						inst.color.updateHSV();
						break;

					case 'g':
						inst.color.b = x;
						inst.color.r = 1 - y;
						inst.color.updateHSV();
						break;

					case 'b':
						inst.color.r = x;
						inst.color.g = 1 - y;
						inst.color.updateHSV();
						break;
					}

					inst._change();
				};

				_html = function () {
					var html = '<div id="ui-colorpicker-map" class="ui-colorpicker-border">'
							+ '<span id="ui-colorpicker-map-layer-1">&nbsp;</span>'
							+ '<span id="ui-colorpicker-map-layer-2">&nbsp;</span>'
							+ (inst.options.alpha ? '<span id="ui-colorpicker-map-layer-alpha">&nbsp;</span>' : '')
							+ '<span id="ui-colorpicker-map-layer-pointer"><span id="ui-colorpicker-map-pointer"></span></span></div>';
					return html;
				};

				this.generate = function () {
					switch (inst.mode) {
					case 'h':
						$('#ui-colorpicker-map-layer-1', e).css({'background-position': '0 0', 'opacity': ''}).show();
						$('#ui-colorcasepicker-map-layer-2', e).hide();
						break;

					case 's':
					case 'a':
						$('#ui-colorpicker-map-layer-1', e).css({'background-position': '0 -260px', 'opacity': ''}).show();
						$('#ui-colorpicker-map-layer-2', e).css({'background-position': '0 -520px', 'opacity': ''}).show();
						break;

					case 'v':
						$(e).css('background-color', 'black');
						$('#ui-colorpicker-map-layer-1', e).css({'background-position': '0 -780px', 'opacity': ''}).show();
						$('#ui-colorpicker-map-layer-2', e).hide();
						break;

					case 'r':
						$('#ui-colorpicker-map-layer-1', e).css({'background-position': '0 -1040px', 'opacity': ''}).show();
						$('#ui-colorpicker-map-layer-2', e).css({'background-position': '0 -1300px', 'opacity': ''}).show();
						break;

					case 'g':
						$('#ui-colorpicker-map-layer-1', e).css({'background-position': '0 -1560px', 'opacity': ''}).show();
						$('#ui-colorpicker-map-layer-2', e).css({'background-position': '0 -1820px', 'opacity': ''}).show();
						break;

					case 'b':
						$('#ui-colorpicker-map-layer-1', e).css({'background-position': '0 -2080px', 'opacity': ''}).show();
						$('#ui-colorpicker-map-layer-2', e).css({'background-position': '0 -2340px', 'opacity': ''}).show();
						break;
					}
					self.repaint();
				};

				this.repaint = function () {
					var div = $('#ui-colorpicker-map-layer-pointer', e),
						x = 0,
						y = 0;

					switch (inst.mode) {
					case 'h':
						x = inst.color.s * div.width();
						y = (1 - inst.color.v) * div.width();
						$(e).css('background-color', inst.color.normClone().toCSS());
						break;

					case 's':
					case 'a':
						x = inst.color.h * div.width();
						y = (1 - inst.color.v) * div.width();
						$('#ui-colorpicker-map-layer-2', e).css('opacity', 1 - inst.color.s);
						break;

					case 'v':
						x = inst.color.h * div.width();
						y = (1 - inst.color.s) * div.width();
						$('#ui-colorpicker-map-layer-1', e).css('opacity', inst.color.v);
						break;

					case 'r':
						x = inst.color.b * div.width();
						y = (1 - inst.color.g) * div.width();
						$('#ui-colorpicker-map-layer-2', e).css('opacity', inst.color.r);
						break;

					case 'g':
						x = inst.color.b * div.width();
						y = (1 - inst.color.r) * div.width();
						$('#ui-colorpicker-map-layer-2', e).css('opacity', inst.color.g);
						break;

					case 'b':
						x = inst.color.r * div.width();
						y = (1 - inst.color.g) * div.width();
						$('#ui-colorpicker-map-layer-2', e).css('opacity', inst.color.b);
						break;
					}

					if (inst.options.alpha) {
						$('#ui-colorpicker-map-layer-alpha', e).css('opacity', 1 - inst.color.a);
					}

					$('#ui-colorpicker-map-pointer', e).css({
						'left': x - 7,
						'top': y - 7
					});
				};

				this.init = function () {
					e = $(_html()).appendTo($('#ui-colorpicker-map-container', inst.dialog));

					e.bind('mousedown', _mousedown);
				};
			},

			bar: function (inst) {
				var self		= this,
					e			= null,
					_mousedown, _mouseup, _mousemove, _html;

				_mousedown = function (event) {
					if (!inst.opened) {
						return;
					}

					var div		= $('#ui-colorpicker-bar-layer-pointer', e),
						offset	= div.offset(),
						width	= div.width(),
						height	= div.height(),
						x		= event.pageX - offset.left,
						y		= event.pageY - offset.top;

					if (x >= 0 && x < width && y >= 0 && y < height) {
						event.stopImmediatePropagation();
						event.preventDefault();
						$(document).unbind('mousedown', _mousedown);
						$(document).bind('mouseup', _mouseup);
						$(document).bind('mousemove', _mousemove);
						_mousemove(event);
					}
				};

				_mouseup = function (event) {
					event.stopImmediatePropagation();
					event.preventDefault();
					$(document).unbind('mouseup', _mouseup);
					$(document).unbind('mousemove', _mousemove);
					$(document).bind('mousedown', _mousedown);
				};

				_mousemove = function (event) {
					event.stopImmediatePropagation();
					event.preventDefault();

					if (event.pageY === self.y) {
						return;
					}
					self.y = event.pageY;

					var div = $('#ui-colorpicker-bar-layer-pointer', e),
						offset  = div.offset(),
						height  = div.height(),
						y = event.pageY - offset.top;

					y = Math.max(0, Math.min(y / height, 1));

					// interpret values
					switch (inst.mode) {
					case 'h':
						inst.color.h = 1 - y;
						inst.color.updateRGB();
						break;

					case 's':
						inst.color.s = 1 - y;
						inst.color.updateRGB();
						break;

					case 'v':
						inst.color.v = 1 - y;
						inst.color.updateRGB();
						break;

					case 'r':
						inst.color.r = 1 - y;
						inst.color.updateHSV();
						break;

					case 'g':
						inst.color.g = 1 - y;
						inst.color.updateHSV();
						break;

					case 'b':
						inst.color.b = 1 - y;
						inst.color.updateHSV();
						break;

					case 'a':
						inst.color.a = 1 - y;
						break;
					}

					inst._change();
				};

				_html = function () {
					var html = '<div id="ui-colorpicker-bar" class="ui-colorpicker-border">'
							+ '<span id="ui-colorpicker-bar-layer-1">&nbsp;</span>'
							+ '<span id="ui-colorpicker-bar-layer-2">&nbsp;</span>'
							+ '<span id="ui-colorpicker-bar-layer-3">&nbsp;</span>'
							+ '<span id="ui-colorpicker-bar-layer-4">&nbsp;</span>';

					if (inst.options.alpha) {
						html += '<span id="ui-colorpicker-bar-layer-alpha">&nbsp;</span>'
							+ '<span id="ui-colorpicker-bar-layer-alphabar">&nbsp;</span>';
					}

					html += '<span id="ui-colorpicker-bar-layer-pointer"><span id="ui-colorpicker-bar-pointer"></span></span></div>';

					return html;
				};

				this.generate = function () {
					switch (inst.mode) {
					case 'h':
					case 's':
					case 'v':
					case 'r':
					case 'g':
					case 'b':
						$('#ui-colorpicker-bar-layer-alpha', e).show();
						$('#ui-colorpicker-bar-layer-alphabar', e).hide();
						break;

					case 'a':
						$('#ui-colorpicker-bar-layer-alpha', e).hide();
						$('#ui-colorpicker-bar-layer-alphabar', e).show();
						break;
					}

					switch (inst.mode) {
					case 'h':
						$('#ui-colorpicker-bar-layer-1', e).css({'background-position': '0 0', 'opacity': ''}).show();
						$('#ui-colorpicker-bar-layer-2', e).hide();
						$('#ui-colorpicker-bar-layer-3', e).hide();
						$('#ui-colorpicker-bar-layer-4', e).hide();
						break;

					case 's':
						$('#ui-colorpicker-bar-layer-1', e).css({'background-position': '0 -260px', 'opacity': ''}).show();
						$('#ui-colorpicker-bar-layer-2', e).css({'background-position': '0 -520px', 'opacity': ''}).show();
						$('#ui-colorpicker-bar-layer-3', e).hide();
						$('#ui-colorpicker-bar-layer-4', e).hide();
						break;

					case 'v':
						$('#ui-colorpicker-bar-layer-1', e).css({'background-position': '0 -520px', 'opacity': ''}).show();
						$('#ui-colorpicker-bar-layer-2', e).hide();
						$('#ui-colorpicker-bar-layer-3', e).hide();
						$('#ui-colorpicker-bar-layer-4', e).hide();
						break;

					case 'r':
						$('#ui-colorpicker-bar-layer-1', e).css({'background-position': '0 -1560px', 'opacity': ''}).show();
						$('#ui-colorpicker-bar-layer-2', e).css({'background-position': '0 -1300px', 'opacity': ''}).show();
						$('#ui-colorpicker-bar-layer-3', e).css({'background-position': '0 -780px', 'opacity': ''}).show();
						$('#ui-colorpicker-bar-layer-4', e).css({'background-position': '0 -1040px', 'opacity': ''}).show();
						break;

					case 'g':
						$('#ui-colorpicker-bar-layer-1', e).css({'background-position': '0 -2600px', 'opacity': ''}).show();
						$('#ui-colorpicker-bar-layer-2', e).css({'background-position': '0 -2340px', 'opacity': ''}).show();
						$('#ui-colorpicker-bar-layer-3', e).css({'background-position': '0 -1820px', 'opacity': ''}).show();
						$('#ui-colorpicker-bar-layer-4', e).css({'background-position': '0 -2080px', 'opacity': ''}).show();
						break;

					case 'b':
						$('#ui-colorpicker-bar-layer-1', e).css({'background-position': '0 -3640px', 'opacity': ''}).show();
						$('#ui-colorpicker-bar-layer-2', e).css({'background-position': '0 -3380px', 'opacity': ''}).show();
						$('#ui-colorpicker-bar-layer-3', e).css({'background-position': '0 -2860px', 'opacity': ''}).show();
						$('#ui-colorpicker-bar-layer-4', e).css({'background-position': '0 -3120px', 'opacity': ''}).show();
						break;

					case 'a':
						$('#ui-colorpicker-bar-layer-1', e).hide();
						$('#ui-colorpicker-bar-layer-2', e).hide();
						$('#ui-colorpicker-bar-layer-3', e).hide();
						$('#ui-colorpicker-bar-layer-4', e).hide();
						break;
					}
					self.repaint();
				};

				this.repaint = function () {
					var div = $('#ui-colorpicker-bar-layer-pointer', e),
						y = 0;

					switch (inst.mode) {
					case 'h':
						y = (1 - inst.color.h) * div.height();
						break;

					case 's':
						y = (1 - inst.color.s) * div.height();
						$('#ui-colorpicker-bar-layer-2', e).css('opacity', 1 - inst.color.v);
						$(e).css('background-color', inst.color.normClone().toCSS());
						break;

					case 'v':
						y = (1 - inst.color.v) * div.height();
						$(e).css('background-color', inst.color.normClone().toCSS());
						break;

					case 'r':
						y = (1 - inst.color.r) * div.height();
						$('#ui-colorpicker-bar-layer-2', e).css('opacity', Math.max(0, (inst.color.b - inst.color.g)));
						$('#ui-colorpicker-bar-layer-3', e).css('opacity', Math.max(0, (inst.color.g - inst.color.b)));
						$('#ui-colorpicker-bar-layer-4', e).css('opacity', Math.min(inst.color.b, inst.color.g));
						break;

					case 'g':
						y = (1 - inst.color.g) * div.height();
						$('#ui-colorpicker-bar-layer-2', e).css('opacity', Math.max(0, (inst.color.b - inst.color.r)));
						$('#ui-colorpicker-bar-layer-3', e).css('opacity', Math.max(0, (inst.color.r - inst.color.b)));
						$('#ui-colorpicker-bar-layer-4', e).css('opacity', Math.min(inst.color.r, inst.color.b));
						break;

					case 'b':
						y = (1 - inst.color.b) * div.height();
						$('#ui-colorpicker-bar-layer-2', e).css('opacity', Math.max(0, (inst.color.r - inst.color.g)));
						$('#ui-colorpicker-bar-layer-3', e).css('opacity', Math.max(0, (inst.color.g - inst.color.r)));
						$('#ui-colorpicker-bar-layer-4', e).css('opacity', Math.min(inst.color.r, inst.color.g));
						break;

					case 'a':
						y = (1 - inst.color.a) * div.height();
						$(e).css('background-color', inst.color.normClone().toCSS());
						break;
					}

					if (inst.mode !== 'a') {
						$('#ui-colorpicker-bar-layer-alpha', e).css('opacity', 1 - inst.color.a);
					}

					$('#ui-colorpicker-bar-pointer', e).css('top', y - 3);
				};

				this.init = function () {
					e = $(_html()).appendTo($('#ui-colorpicker-bar-container', inst.dialog));

					e.bind('mousedown', _mousedown);
				};
			},

			inputs: function (inst) {
				var self = this,
					e = null,
					_html;

				_html = function () {
					var html = '<div id="ui-colorpicker-inputs">';

					if (inst.options.hsv) {
						html +=	'<div id="ui-colorpicker-h"><input class="ui-colorpicker-mode" type="radio" value="h"/><label>H:</label><input class="ui-colorpicker-number ui-colorpicker-number-hsv" type="number" min="0" max="360" size="10"/><span class="ui-colorpicker-unit">&deg;</span></div>'
							+ '<div id="ui-colorpicker-s"><input class="ui-colorpicker-mode" type="radio" value="s"/><label>S:</label><input class="ui-colorpicker-number ui-colorpicker-number-hsv" type="number" min="0" max="100" size="10"/><span class="ui-colorpicker-unit">%</span></div>'
							+ '<div id="ui-colorpicker-v"><input class="ui-colorpicker-mode" type="radio" value="v"/><label>V:</label><input class="ui-colorpicker-number ui-colorpicker-number-hsv" type="number" min="0" max="100" size="10"/><span class="ui-colorpicker-unit">%</span></div>';
					}

					if (inst.options.rgb) {
						html += '<div id="ui-colorpicker-r"><input class="ui-colorpicker-mode" type="radio" value="r"/><label>R:</label><input class="ui-colorpicker-number ui-colorpicker-number-rgb" type="number" min="0" max="255" size="10"/><span class="ui-colorpicker-unit"></span></div>'
							+ '<div id="ui-colorpicker-g"><input class="ui-colorpicker-mode" type="radio" value="g"/><label>G:</label><input class="ui-colorpicker-number ui-colorpicker-number-rgb" type="number" min="0" max="255" size="10"/><span class="ui-colorpicker-unit"></span></div>'
							+ '<div id="ui-colorpicker-b"><input class="ui-colorpicker-mode" type="radio" value="b"/><label>B:</label><input class="ui-colorpicker-number ui-colorpicker-number-rgb" type="number" min="0" max="255" size="10"/><span class="ui-colorpicker-unit"></span></div>';
					}

					if (inst.options.alpha) {
						html += '<div id="ui-colorpicker-a"><input class="ui-colorpicker-mode" name="mode" type="radio" value="a"/><label>A:</label><input class="ui-colorpicker-number ui-colorpicker-number-a" type="number" min="0" max="100" size="10"/><span class="ui-colorpicker-unit">%</span></div>';
					}

					return html + '</div>';
				};

				this.init = function () {
					e = $(_html()).appendTo($('#ui-colorpicker-inputs-container', inst.dialog));

					$('.ui-colorpicker-mode', e).click(function () {
						inst.mode = $(this).val();
						inst._generateAllParts();
					});

					$('.ui-colorpicker-number', e).bind('change input keyup', function () {
						inst.color.r = $('#ui-colorpicker-r .ui-colorpicker-number', e).val() / 255;
						inst.color.g = $('#ui-colorpicker-g .ui-colorpicker-number', e).val() / 255;
						inst.color.b = $('#ui-colorpicker-b .ui-colorpicker-number', e).val() / 255;
						inst.color.a = $('#ui-colorpicker-a .ui-colorpicker-number', e).val() / 100;
						inst.color.h = $('#ui-colorpicker-h .ui-colorpicker-number', e).val() / 360;
						inst.color.s = $('#ui-colorpicker-s .ui-colorpicker-number', e).val() / 100;
						inst.color.v = $('#ui-colorpicker-v .ui-colorpicker-number', e).val() / 100;

						if ($(this).hasClass('ui-colorpicker-number-hsv')) {
							inst.color.updateRGB();
						} else if ($(this).hasClass('ui-colorpicker-number-rgb')) {
							inst.color.updateHSV();
						}

						inst._change();
					});
				};

				this.repaint = function () {
					var c = $.extend(inst.color);
					c.h *= 360;
					c.s *= 100;
					c.v *= 100;
					c.r *= 255;
					c.g *= 255;
					c.b *= 255;
					c.a *= 100;

					$.each(c, function (index, value) {
						var v = Math.round(value);
						if (!$('#ui-colorpicker-' + index + ' .ui-colorpicker-number', e).is(':focus')
								&& $('#ui-colorpicker-' + index + ' .ui-colorpicker-number', e).val() !== v) {
							$('#ui-colorpicker-' + index + ' .ui-colorpicker-number', e).val(v);
						}
					});
				};

				this.generate = function () {
					$('.ui-colorpicker-mode', e).each(function () {
						$(this).attr('checked', $(this).val() === inst.mode);
					});
					this.repaint();
				};
			},

			preview: function (inst) {
				var self = this,
					e = null,
					_html;

				_html = function () {
					return '<div id="ui-colorpicker-preview">'
						+ '<span class="ui-colorpicker-border">'
						+ '<div id="ui-colorpicker-preview-initial"><div id="ui-colorpicker-preview-initial-alpha"></div></div>'
						+ '<div id="ui-colorpicker-preview-current"><div id="ui-colorpicker-preview-current-alpha"></div></div>'
						+ '</span>'
						+ '</div>';
				};

				this.init = function () {
					e = $(_html()).appendTo($('#ui-colorpicker-preview-container', inst.dialog));

					$('#ui-colorpicker-preview-initial', e).click(function () {
						inst.color = $.extend({}, inst.currentColor);
						inst._change();
					});

				};

				this.repaint = function () {
					$('#ui-colorpicker-preview-initial', e).css('background-color', inst.currentColor.toCSS()).attr('title', inst.currentColor.toHex());
					$('#ui-colorpicker-preview-initial-alpha', e).css('opacity', 1 - inst.currentColor.a);
					$('#ui-colorpicker-preview-current', e).css('background-color', inst.color.toCSS()).attr('title', inst.color.toHex());
					$('#ui-colorpicker-preview-current-alpha', e).css('opacity', 1 - inst.color.a);
				};

				this.generate = function () {
					if (inst.options.alpha) {
						$('#ui-colorpicker-preview-initial-alpha, #ui-colorpicker-preview-current-alpha', e).show();
					} else {
						$('#ui-colorpicker-preview-initial-alpha, #ui-colorpicker-preview-current-alpha', e).hide();
					}

					this.repaint();
				};
			},

			hex: function (inst) {
				var self = this,
					e = null,
					_html;

				_html = function () {
					var html = '';

					if (inst.options.alpha) {
						html += '<input id="ui-colorpicker-hex-alpha" maxlength="2" size="2"/>';
					}

					html += '<input id="ui-colorpicker-hex-input" maxlength="6" size="6"/>';

					return '<div id="ui-colorpicker-hex"><label for="ui-colorpicker-hex-input">#: </label>' + html + '</div>';
				};

				this.init = function () {
					e = $(_html()).appendTo($('#ui-colorpicker-hex-container', inst.dialog));

					$('#ui-colorpicker-hex-input', e).bind('change keyup', function () {
						var rgb = inst._parseHex($(this).val());
						inst.color.r = rgb[0];
						inst.color.g = rgb[1];
						inst.color.b = rgb[2];
						inst.color.updateHSV();
						inst._change();
					});

					$('#ui-colorpicker-hex-alpha', e).bind('change keyup', function () {
						inst.color.a = parseInt($('#ui-colorpicker-hex-alpha', e).val(), 16);
						inst._change();
					});
				};

				this.repaint = function () {
					if (!$('#ui-colorpicker-hex-input', e).is(':focus')) {
						$('#ui-colorpicker-hex-input', e).val(inst.color.toHex(true));
					}

					if (!$('#ui-colorpicker-hex-alpha', e).is(':focus')) {
						$('#ui-colorpicker-hex-alpha', e).val(inst._intToHex(inst.color.a * 255));
					}
				};

				this.generate = function () {
					this.repaint();
				};
			},

			swatches: function (inst) {
				var self = this,
					e = null,
					_html;

				_html = function () {
					var html = '';

					$.each(inst.options.swatches, function (name, color) {
						var hex = inst._intToHex(color[0]) + inst._intToHex(color[1]) + inst._intToHex(color[2]);
						html += '<div class="ui-colorpicker-swatch" style="background-color: #' + hex + '" title="' + name + '"></div>';
					});

					return '<div id="ui-colorpicker-swatches" class="ui-colorpicker-border">' + html + '</div>';
				};

				this.init = function () {
					e = $(_html()).appendTo($('#ui-colorpicker-swatches-container', inst.dialog));

					$('.ui-colorpicker-swatch', e).click(function () {
						var rgb		= inst._parseColor($(this).css('background-color'));
						inst.color	= (rgb === false ? new inst.Color() : new inst.Color(rgb[0], rgb[1], rgb[2]));
						inst._change();
					});
				};

				this.repaint = function () {
					// Not affected by changing color;
				};

				this.generate = function () {
					// Not affected by changing color;
				};
			},

			footer: function (inst) {
				var self = this,
					e = null,
					_html;

				_html = function () {
					return '<div class="ui-dialog-buttonpane ui-widget-content">'
						+ (inst.options.alpha ? '<button class="ui-colorpicker-transparent">transparent</button>' : '')
						+ (inst.inline ? '' : '<div class="ui-dialog-buttonset">'
							+ '<button class="ui-colorpicker-close">Done</button>'
							+ '</div>')
						+ '</div>';
				};

				this.init = function () {
					e = $(_html()).appendTo(inst.dialog);

					$('.ui-colorpicker-close', e).button().click(function () {
						inst.close();
					});

					if (inst.options.alpha) {
						$('.ui-colorpicker-transparent', e).button().click(function () {
							inst.color.a = 0;
							inst._change();
						});
					}
				};

				this.repaint = function () {};

				this.generate = function () {};
			}
		},

		_parseHex: function (color) {
			var name = $.trim(color).toLowerCase(),
				c,
				m;

			if (_colors[name]) {
				c = _colors[name];
				return [c[0] / 255, c[1] / 255, c[2] / 255];
			}

			// {#}rrggbb
			m = /^#?([a-fA-F0-9]{0,6})/.exec(color);
			if (m) {
				c = parseInt(m[1], 16);
				return [((c >> 16) & 0xFF) / 255,
						((c >>  8) & 0xFF) / 255,
						(c & 0xFF) / 255];
			}
		},

		_parseColor: function (color) {
			var m;

			// rgba(r,g,b,a)
			m = /rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*(\d+(?:\.\d+)?)\s*)?\)/.exec(color);
			if (m) {
				return [
					m[1] / 255,
					m[2] / 255,
					m[3] / 255,
					m[4] / 255
				];
			}

			// rgba(r%,g%,b%,a%)
			m = /rgba?\(\s*(\d+(?:\.\d+)?)\%\s*,\s*(\d+(?:\.\d+)?)\%\s*,\s*(\d+(?:\.\d+)?)\%\s*(?:,\s*(\d+(?:\.\d+)?)\s*)?\)/.exec(color);
			if (m) {
				return [
					m[1] / 100,
					m[2] / 100,
					m[3] / 100,
					m[4] / 100
				];
			}

			// #rrggbb
			m = /#([a-fA-F0-9]{2})([a-fA-F0-9]{2})([a-fA-F0-9]{2})/.exec(color);
			if (m) {
				return [
					parseInt(m[1], 16) / 255,
					parseInt(m[2], 16) / 255,
					parseInt(m[3], 16) / 255
				];
			}

			// #rgb
			m = /#([a-fA-F0-9])([a-fA-F0-9])([a-fA-F0-9])/.exec(color);
			if (m) {
				return [
					parseInt(m[1] + m[1], 16) / 255,
					parseInt(m[2] + m[2], 16) / 255,
					parseInt(m[3] + m[3], 16) / 255
				];
			}

			return this._parseHex(color);
		},

		Color: function () {
			var a, args = arguments;

			this.updateRGB = function () {
				this.h = Math.max(0, Math.min(this.h, 1));
				this.s = Math.max(0, Math.min(this.s, 1));
				this.v = Math.max(0, Math.min(this.v, 1));

				if (this.s === 0) {
					this.r = this.g = this.b = this.v;
				} else {
					var var_h = this.h === 1 ? 0 : this.h * 6,
						var_i = Math.floor(var_h),
						var_1 = this.v * (1 - this.s),
						var_2 = this.v * (1 - this.s * (var_h - var_i)),
						var_3 = this.v * (1 - this.s * (1 - (var_h - var_i)));

					if (var_i === 0) {
						this.r = this.v;
						this.g = var_3;
						this.b = var_1;
					} else if (var_i === 1) {
						this.r = var_2;
						this.g = this.v;
						this.b = var_1;
					} else if (var_i === 2) {
						this.r = var_1;
						this.g = this.v;
						this.b = var_3;
					} else if (var_i === 3) {
						this.r = var_1;
						this.g = var_2;
						this.b = this.v;
					} else if (var_i === 4) {
						this.r = var_3;
						this.g = var_1;
						this.b = this.v;
					} else {
						this.r = this.v;
						this.g = var_1;
						this.b = var_2;
					}
				}
				return this;
			};

			this.updateHSV = function () {
				var minVal, maxVal, delta, del_R, del_G, del_B;
				this.r = Math.max(0, Math.min(this.r, 1));
				this.g = Math.max(0, Math.min(this.g, 1));
				this.b = Math.max(0, Math.min(this.b, 1));

				minVal = Math.min(this.r, this.g, this.b);
				maxVal = Math.max(this.r, this.g, this.b);
				delta = maxVal - minVal;

				this.v = maxVal;

				if (delta === 0) {
					this.h = 0;
					this.s = 0;
				} else {
					this.s = delta / maxVal;
					del_R = (((maxVal - this.r) / 6) + (delta / 2)) / delta;
					del_G = (((maxVal - this.g) / 6) + (delta / 2)) / delta;
					del_B = (((maxVal - this.b) / 6) + (delta / 2)) / delta;

					if (this.r === maxVal) {
						this.h = del_B - del_G;
					} else if (this.g === maxVal) {
						this.h = (1 / 3) + del_R - del_B;
					} else if (this.b === maxVal) {
						this.h = (2 / 3) + del_G - del_R;
					}

					if (this.h < 0) {
						this.h += 1;
					} else if (this.h > 1) {
						this.h -= 1;
					}
				}
				return this;
			};

			this._hexify = function (number) {
			   // return Math.round(number).toString(16);
				var digits = '0123456789abcdef',
					lsd = number % 16,
					msd = (number - lsd) / 16,
					hexified = digits.charAt(msd) + digits.charAt(lsd);
				return hexified;
			};

			this.toHex = function () {
				return this._hexify(this.r * 255) + this._hexify(this.g * 255) + this._hexify(this.b * 255);
			};

			this.toCSS = function () {
				return '#' + this.toHex();
			};

			this.toHexAlpha = function () {
				return this._hexify(this.a * 255);
			};

			this.normClone = function () {
				return $.extend({}, this, {s: 1, v: 1}).updateRGB();
			};

			this.equals = function (rgb) {
				return rgb[0] === this.r
					&& rgb[1] === this.g
					&& rgb[2] === this.b;
			};

			this.limit = function (steps) {
				steps -= 1;
				this.r = Math.round(this.r * steps) / steps;
				this.g = Math.round(this.g * steps) / steps;
				this.b = Math.round(this.b * steps) / steps;
				this.updateHSV();
			};

			for (a = 0; a < args.length; a += 1) {
				args[a] = Math.max(0, Math.min(args[a], 1));
			}

			if (args.length === 0) {
				this.r = 0;
				this.g = 0;
				this.b = 0;
				this.a = 1;
				this.h = 0;
				this.s = 0;
				this.v = 0;
			} else if (args.length === 3) {
				// r,g,b
				this.r = args[0] || 0;
				this.g = args[1] || 0;
				this.b = args[2] || 0;
				this.a = 1;
				this.updateHSV();
			} else if (args.length === 7) {
				// r,g,b,a,h,s,v
				this.r = args[0] || 0;
				this.g = args[1] || 0;
				this.b = args[2] || 0;
				this.a = args[3] || 0;
				this.h = args[4] || 0;
				this.s = args[5] || 0;
				this.v = args[6] || 0;
			}
		}
	});

}(jQuery));

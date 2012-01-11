Ti._5.createClass('Titanium.UI.iPad', function(args){
	var obj = this;
	// Interfaces
	Ti._5.DOMView(this, 'ipad', args, 'iPad');

	// Properties
	Ti._5.prop(this, 'POPOVER_ARROW_DIRECTION_ANY');

	Ti._5.prop(this, 'POPOVER_ARROW_DIRECTION_DOWN');

	Ti._5.prop(this, 'POPOVER_ARROW_DIRECTION_LEFT');

	Ti._5.prop(this, 'POPOVER_ARROW_DIRECTION_RIGHT');

	Ti._5.prop(this, 'POPOVER_ARROW_DIRECTION_UNKNOWN');

	Ti._5.prop(this, 'POPOVER_ARROW_DIRECTION_UP');

	// Methods
	this.createPopover = function(){
		console.debug('Method "Titanium.UI.iPad#.createPopover" is not implemented yet.');
	};
	this.createSplitWindow = function(){
		console.debug('Method "Titanium.UI.iPad#.createSplitWindow" is not implemented yet.');
	};

	require.mix(this, args);
});
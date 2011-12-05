Ti._5.createClass('Titanium.UI.AlertDialog', function(args){
	var obj = this;
	var _type = 'alert';
	// Interfaces
	//Ti._5.DOMView(this, 'alertdialog', args, 'AlertDialog');
	Ti._5.EventDriven(this);
	this.add = function (arg) { ; };
	this.render = function(parent) { ; };
	this.layout = null;

	// Properties
	var _buttonNames = null;
	Ti._5.prop(this, 'buttonNames', {
		get: function(){return _buttonNames;},
		set: function(val) {
			if(val && 1 < val.length) {
				_type = 'dialog';	
				return _buttonNames = val;
			}
			return null;
		}
	});

	var _cancel = null;
	Ti._5.prop(this, 'cancel', {
		get: function(){return _cancel;},
		set: function(val){
			if(parseInt(val) == val) {
				_type = 'dialog';	
				return _cancel = val;
			}
			return null;
		}
	});

	Ti._5.prop(this, 'message', '');

	Ti._5.prop(this, 'messageid');

	Ti._5.prop(this, 'title');
	
	require.mix(this, args);

	// Methods
	this.hide = function(){
		console.debug('Method "Titanium.UI.AlertDialog#.hide" is not implemented yet.');
	};
	this.show = function(){
		var isConfirm = false;
		if ('alert' == _type) {
			alert(obj.message);
		} else {
			isConfirm = confirm(obj.message);
		}
		obj.fireEvent('click', {
			cancel	: !isConfirm,
			index	: !isConfirm ? 0 : 1,
			source	: obj,
			type	: 'click'
		});
	};
});
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
	Object.defineProperty(this, 'buttonNames', {
		get: function(){return _buttonNames;},
		set: function(val) {
			if(val && 1 < val.length) {
				_type = 'dialog';	
				_buttonNames = val;
			}
		}
	});

	var _cancel = null;
	Object.defineProperty(this, 'cancel', {
		get: function(){return _cancel;},
		set: function(val){
			if(parseInt(val) == val) {
				_type = 'dialog';	
				_cancel = val;
			}
		}
	});

	var _message = '';
	Object.defineProperty(this, 'message', {
		get: function(){return _message;},
		set: function(val){return _message = val;}
	});

	var _messageid = null;
	Object.defineProperty(this, 'messageid', {
		get: function(){return _messageid;},
		set: function(val){return _messageid = val;}
	});

	var _title = null;
	Object.defineProperty(this, 'title', {
		get: function(){return _title;},
		set: function(val){return _title = val;}
	});
	
	Ti._5.preset(this, ["buttonNames", "cancel", "message"], args);
	Ti._5.presetUserDefinedElements(this, args);

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
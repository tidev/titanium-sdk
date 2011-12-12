Ti._5.createClass("Ti.UI.AlertDialog", function(args){
	var obj = this,
		_type = "alert",
		_buttonNames = null,
		_cancel = null;

	// Interfaces
	//Ti._5.DOMView(obj, "alertdialog", args, "AlertDialog");
	Ti._5.EventDriven(obj);

	obj.add = function (){};
	obj.render = function(){};
	obj.layout = null;

	// Properties
	Ti._5.prop(obj, {
		buttonNames: {
			get: function(){return _buttonNames;},
			set: function(val) {
				if (val && val.length > 1) {
					_type = "dialog";	
					_buttonNames = val;
				}
			}
		},
		cancel: {
			get: function(){return _cancel;},
			set: function(val){
				if (parseInt(val) == val) {
					_type = "dialog";	
					_cancel = val;
				}
			}
		},
		message: "",
		messageid: "",
		title: ""
	});

	require.mix(obj, args);

	// Methods
	obj.hide = function(){
		console.debug('Method "Titanium.UI.AlertDialog#.hide" is not implemented yet.');
	};
	obj.show = function(){
		var isConfirm = false;
		if ("alert" == _type) {
			alert(obj.message);
		} else {
			isConfirm = confirm(obj.message);
		}
		obj.fireEvent("click", {
			cancel: !isConfirm,
			index: !isConfirm|0
		});
	};
});
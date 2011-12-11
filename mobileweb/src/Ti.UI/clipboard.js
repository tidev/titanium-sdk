(function(api){
	var obj = this,
		_data = {
			'text/plain' : "",
			'text/uri-list' : "",
			'image' : ""
		};

	// Interfaces
	Ti._5.EventDriven(api);

	// Methods
	api.clearData = function(type){
		if (type && 'undefined' != typeof _data[type]) {
			_data[type] = "";
		}
		if (!type) {
			_data = {
				'text/plain' : "",
				'text/uri-list' : "",
				'image' : ""
			}
		}
	};
	api.clearText = function(){
		_data['text/plain'] = "";
	};
	api.getData = function(type){
		return _data[type];
	};
	api.getText = function(){
		return _data['text/plain'];
	};
	api.hasData = function(){
		for (var sKey in _data) {
			if (_data.hasOwnProperty(sKey) && 'text/plain' != sKey && _data[sKey]) {
				return true;
			}
		}
		return false;
	};
	api.hasText = function(){
		return !!_data['text/plain'];
	};
	api.setData = function(type, data){
		if ('text' == type) {
			type = 'text/plain';
		}
		if ('undefined' != typeof _data[type]) {
			_data[type] = data;
		}
	};
	api.setText = function(text){
		api.setData('text/plain', text);
	};

})(Ti._5.createClass('Titanium.UI.Clipboard'));

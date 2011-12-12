(function(api){
	// Interfaces
	Ti._5.EventDriven(api);
	var STORAGE = "html5_localStorage";
	var _getProp = function(prop, def, transform){
		if(prop == null){
			return;
		}
		var storage = localStorage.getItem(STORAGE);
		if(storage == null){
			storage = [];
		} else {
			storage = JSON.parse(storage);
		}
		var val =  storage[prop];
		if(val != null){
			return typeof transform !== 'undefined' ? transform(val) : val;
		} else if (typeof def !== 'undefined'){
			return def;
		}

		return val;
	};

	var _setProp = function(prop, val, transform){
		if(prop == null || typeof val === 'undefined'){
			return;
		}
		val = typeof transform !== 'undefined' ? transform(val) : val;
		var storage = localStorage.getItem(STORAGE);
		if(storage == null){
			storage = {};
		} else {
			storage = JSON.parse(storage);
		}
		if(prop != null){
			storage[prop] = val;
		}
		localStorage.setItem(STORAGE, JSON.stringify(storage));
	};

	var _parseBoolean = function(val){return Boolean(val);};
	// Methods
	api.getBool = function(prop, def){
		return _getProp(prop, def, _parseBoolean);
	};
	api.getDouble = function(prop, def){
		return _getProp(prop, def, parseFloat);
	};
	api.getInt = function(prop, def){
		return _getProp(prop, def, parseInt);
	};
	api.getList = function(prop, def){
		return _getProp(prop, def, function(val){
			if(val instanceof Array){
				return val;
			}
			return [val];
		});
	};
	api.getString = function(prop, def){
		return _getProp(prop, def, function(val){
			if(typeof val === 'string'){
				return val;
			}
			return val.toString();
		});
	};
	api.hasProperty = function(prop){
		return typeof _getProp(prop) !== 'undefined';
	};
	api.listProperties = function(){
		var storage = localStorage.getItem(STORAGE);
		if(storage == null){
			return [];
		} else {
			storage = JSON.parse(storage);
		}
		var props = [];
		for(var key in storage){
			props.push(key);
		}

		return props;
	};
	api.removeProperty = function(prop){
		var storage = localStorage.getItem(STORAGE);
		if(storage == null){
			return;
		} else {
			storage = JSON.parse(storage);
		}
		
		delete storage[prop];

		localStorage.setItem(STORAGE, JSON.stringify(storage));
	};
	api.setBool = function(prop, val){
		_setProp(prop, val, _parseBoolean);
	};
	api.setDouble = function(prop, val){
		_setProp(prop, val, parseFloat);
	};
	api.setInt = function(prop, val){
		_setProp(prop, val, parseInt);
	};
	api.setList = function(prop, val){
		_setProp(prop, val, function(val){
			if(val instanceof Array){
				return val;
			}
			return [val];
		});
	};
	api.setString = function(prop, val){
		_setProp(prop, val, function(val){
			if(typeof val === 'string'){
				return val;
			}
			return val.toString();
		});
	};
})(Ti._5.createClass('Ti.App.Properties'));

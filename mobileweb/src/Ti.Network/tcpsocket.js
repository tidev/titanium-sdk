Ti._5.createClass('Titanium.Network.TCPSocket', function(args){

	// deprecated in 1.7.0 in favor for Titanium.Network.Socket.TCP

	var obj = this;
	var _socket = null;
	
	// Properties
	var _hostName = '';
	Ti._5.prop(api, 'hostName', {
		get: function(){return _hostName;},
		set: function(val){_hostName = val;}
	});
	obj.hostName = args && args[0] ? args[0] : '';

	Ti._5.prop(api, 'isValid', {
		get: function() {return _socket && !!_socket.close;}
	});

	var _mode = 0;
	Ti._5.prop(api, 'mode', {
		get: function(){return _mode;},
		set: function(val){_mode = val || Titanium.Network.READ_WRITE_MODE;}
	});
	obj.mode =  args && args[2] ? args[2] : 0;

	var _port = 0;
	Ti._5.prop(api, 'port', {
		get: function(){return _port;},
		set: function(val){_port = val || 81;}
	});
	obj.port =  args && args[1] ? args[1] : 0;

	var _stripTerminator = false;
	Ti._5.prop(api, 'stripTerminator', {
		get: function(){return _stripTerminator;},
		set: function(val){_stripTerminator = val;}
	});

	// Methods
	api.close = function(){
		_socket.close();
	};
	api.connect = function(){
		var full = obj.hostName.split('/');
		var host = full[0], path = [];
		for (var iCounter = 1; iCounter < full.length; iCounter++) {
			path.push(full[iCounter]);
		}
		_socket = new WebSocket("ws://"+host+":"+obj.port+"/"+path.join("/"));
	};
	api.listen = function(){
		_socket.addEventListener("message", function(event) {
			obj.fireEvent('read', {
				data		: event && event.data ? event.data : null, 
				from		: _socket,
				source		: event.target,
				type		: event.type
			});
		}, false);
	};
	api.write = function(val){
		if (_socket && _socket.send) {
			_socket.send(val); 
		} else {
			obj.fireEvent("writeError", {
				code		: 0, 
				error		: 'Sockets does not supported',
				type		: ''
			});
		}
	};

	// Events
	var _errorSet = false;
	api.addEventListener('error', function(event){
		var oEvent = {
			code		: 0, 
			error		: event.description, 
			source		: event.target,
			type		: event.type
		};
		obj.fireEvent('readError', oEvent);
		obj.fireEvent('writeError', oEvent);
	});
});
Ti._5.createClass('Titanium.Network.TCPSocket', function(args){

	// deprecated in 1.7.0 in favor for Titanium.Network.Socket.TCP

	var obj = this;
	var _socket = null;
	
	// Properties
	var _hostName = '';
	Object.defineProperty(api, 'hostName', {
		get: function(){return _hostName;},
		set: function(val){_hostName = val;}
	});
	obj.hostName = args && args[0] ? args[0] : '';

	Object.defineProperty(api, 'isValid', {
		get: function() {return _socket && _socket.close ? true : false;},
		set: function(val){ ; /* Do nothing  */}
	});

	var _mode = 0;
	Object.defineProperty(api, 'mode', {
		get: function(){return _mode;},
		set: function(val){_mode = val ? val : Titanium.Network.READ_WRITE_MODE;}
	});
	obj.mode =  args && args[2] ? args[2] : 0;

	var _port = 0;
	Object.defineProperty(api, 'port', {
		get: function(){return _port;},
		set: function(val){_port = val ? val : 81;}
	});
	obj.port =  args && args[1] ? args[1] : 0;

	var _stripTerminator = false;
	Object.defineProperty(api, 'stripTerminator', {
		get: function(){return _stripTerminator;},
		set: function(val){return _stripTerminator = val;}
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
			var oEvent = {
				data		: event && event.data ? event.data : null, 
				from		: _socket,
				source		: event.target,
				type		: event.type
			};
			obj.fireEvent('read', oEvent);
		}, false);
	};
	api.write = function(val){
		if (_socket && _socket.send) {
			_socket.send(val); 
		} else {
			obj.fireEvent("writeError", {
				code		: 0, 
				error		: 'Sockets does not supported',
				source		: obj,
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
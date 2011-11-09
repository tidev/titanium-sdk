(function(api){
	// Interfaces
	Ti._5.EventDriven(api);

	// Properties
	api.ACCURACY_BEST = 0;
	api.ACCURACY_HUNDRED_METERS = 2;
	api.ACCURACY_KILOMETER = 3;
	api.ACCURACY_NEAREST_TEN_METERS = 1;
	api.ACCURACY_THREE_KILOMETERS = 4;

	api.AUTHORIZATION_AUTHORIZED = 4;
	api.AUTHORIZATION_DENIED = 1;
	api.AUTHORIZATION_RESTRICTED = 2;
	api.AUTHORIZATION_UNKNOWN = 0;

	api.ERROR_DENIED = 1;
	api.ERROR_HEADING_FAILURE = 2;
	api.ERROR_LOCATION_UNKNOWN = 3;
	api.ERROR_NETWORK = 0;
	api.ERROR_REGION_MONITORING_DELAYED = 4;
	api.ERROR_REGION_MONITORING_DENIED = 5;
	api.ERROR_REGION_MONITORING_FAILURE = 6;

	api.PROVIDER_GPS = 1;
	api.PROVIDER_NETWORK = 2;

	var _accuracy = api.ACCURACY_BEST;
	Object.defineProperty(api, 'accuracy', {
		get: function(){return _accuracy;},
		set: function(val){return _accuracy = val;}
	});

	var _locationServicesAuthorization = null;
	Object.defineProperty(api, 'locationServicesAuthorization', {
		get: function(){return _locationServicesAuthorization;},
		set: function(val){return _locationServicesAuthorization = val;}
	});

	var _locationServicesEnabled = null;
	Object.defineProperty(api, 'locationServicesEnabled', {
		get: function(){return _locationServicesEnabled;},
		set: function(val){return _locationServicesEnabled = val;}
	});

	var _preferredProvider = null;
	Object.defineProperty(api, 'preferredProvider', {
		get: function(){return _preferredProvider;},
		set: function(val){return _preferredProvider = val;}
	});

	var _purpose = null;
	Object.defineProperty(api, 'purpose', {
		get: function(){return _purpose;},
		set: function(val){return _purpose = val;}
	});

	var _showCalibration = true;
	Object.defineProperty(api, 'showCalibration', {
		get: function(){return _showCalibration;},
		set: function(val){return _showCalibration = val;}
	});

	// Methods
	api.getCurrentPosition = function(callbackFunc) {
		if (_lastPosition && 'function' == typeof callbackFunc) {
			callbackFunc(_lastPosition);
			return;
		}
		if (_lastError) {
			if ('function' == typeof callbackFunc) {
				callbackFunc(_lastError);
			}
			return;
		}
		navigator.geolocation.getCurrentPosition(
			function(oPos){
				var oResult = {
					coords : {
						latitude : oPos.coords.latitude,
						longitude : oPos.coords.longitude,
						altitude : oPos.coords.altitude,
						heading : oPos.coords.heading,
						accuracy : oPos.coords.accuracy,
						speed : oPos.coords.speed,
						altitudeAccuracy : oPos.coords.altitudeAccuracy,
						timestamp : oPos.timestamp
					}
				};
				oResult.code = 0;
				oResult.error = '';
				oResult.success = true;

				if ('function' == typeof callbackFunc) {
					callbackFunc(oResult);
				}
			},
			function(oError){
				var oResult = {
					message : oError.message
				};
				oResult.coords = null;
				oResult.error = oError.message;
				oResult.success = false;

				if ('function' == typeof callbackFunc) {
					callbackFunc(oResult);
				}
			},
			{
				enableHighAccuracy : _accuracy < 3 || api.ACCURACY_BEST == _accuracy ? true : false
			}
		);
	};

	var _watchId;
	var _oldAddEventListener = api.addEventListener, _lastPosition = null, _lastError = null;
	api.addEventListener = function(eventType, callback){
		_oldAddEventListener(eventType, callback);
		if(eventType == 'location'){
			_watchId = navigator.geolocation.watchPosition(
				function(oPos){
					var oResult = {
						coords : {
							latitude : oPos.coords.latitude,
							longitude : oPos.coords.longitude,
							altitude : oPos.coords.altitude,
							heading : oPos.coords.heading,
							accuracy : oPos.coords.accuracy,
							speed : oPos.coords.speed,
							altitudeAccuracy : oPos.coords.altitudeAccuracy,
							timestamp : oPos.timestamp
						}
					};
					oResult.code = 0;
					oResult.error = '';
					oResult.success = true;
					oResult.provider = null;
					oResult.source = api;
					oResult.type = 'location';
					_lastPosition = oResult;
					_lastError = null;

					api.fireEvent('location', oResult);
					/*
					if (oPos.heading) {
						api.fireEvent('heading', oPos);
					}
					*/
				},
				function(oError){
					var oResult = {
						message : oError.message
					};
					oResult.coords = null;
					oResult.error = oError.message;
					oResult.success = false;
					oResult.provider = null;
					oResult.source = api;
					oResult.type = 'location';
					_lastPosition = null;
					_lastError = oResult;

					api.fireEvent('location', oResult);
					/*
					if (oPos.heading) {
						api.fireEvent('heading', oPos);
					}
					*/
				},
				{
					enableHighAccuracy : _accuracy < 3 || api.ACCURACY_BEST == _accuracy ? true : false
				}
			);
		}
	};
	var _oldRemoveEventlistener = api.removeEventListener;
	api.removeEventListener = function(eventName, cb){
		_oldRemoveEventlistener(eventName, cb);
		if(eventName == 'location'){
			navigator.geolocation.clearWatch(_watchId);
		}
	};

	api.forwardGeocoder = function(address, callbackFunc) {};
	api.getCurrentHeading = function(callbackFunc) {};
	api.reverseGeocoder = function(latitude, longitude, callbackFunc) {};
	api.setShowCalibration = function(val) {
		/*
		if ('undefined' == typeof val) {
			val = true;
		}
		*/
		api.showCalibration = val ? true : false;
	};
})(Ti._5.createClass('Ti.Geolocation'));

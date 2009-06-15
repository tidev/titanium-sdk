Titanium.geoProxy = window.TitaniumGeolocation;

Titanium.Geolocation = {
	UNKNOWN_ERROR : 0,
	PERMISSION_DENIED : 1,
	POSITION_UNAVAILABLE : 2,
	TIMEOUT : 3,
	/**
	 * @tiapi(method=True,name=Geolocation.getCurrentPosition,since=0.4) Query the device for the last known position.
	 * @tiapi On Android, this method does not cause the radio to start.
	 * @tiarg[function,success] Function to be invoked with a position object if the operation is successful.
	 * @tiarg[function,failure] Function to be invoked if a failure occurs while retrieving the last position.
	 * @tiarg[object,options] An object that contains options to used by the method.
	 */
	getCurrentPosition : function(success, failure, options) {
		var o = transformObjectValue(options, {});
		var json = Titanium.JSON.stringify(o);

		Titanium.geoProxy.getCurrentPosition(
				registerCallback(this, success),
				registerCallback(this, failure),
				json);
	},
	/**
	 * @tiapi(method=True,name=Geolocation.watchPosition,since=0.4) Register to receive geolocation updates.
	 * @tiarg[function,success] Function to be invoked with a position object if the operation is successful.
	 * @tiarg[function,failure] Function to be invoked if a failure occurs while retrieving the last position.
	 * @tiarg[object,options] An object that contains options to used by the method.
	 * @tiresult[int] id to pass to clearWatch to stop un-register.
	 */
	watchPosition : function(success, failure, options) {
		var o = transformObjectValue(options, {});
		var json = Titanium.JSON.stringify(o);

		return Titanium.geoProxy.watchPosition(
			registerCallback(this, success),
			registerCallback(this, failure),
			json);
	},
	/**
	 * @tiapi(method=True,name=Geolocation.clearWatch,since=0.4) Stop watching geolocation events.
	 * @tiarg[int,watchId] The value returned from watchPosition.
	 */
	clearWatch : function(watchId) {
		Titanium.geoProxy.clearWatch(watchId);
	}
};

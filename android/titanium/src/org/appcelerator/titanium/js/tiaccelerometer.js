Titanium.accelerometerProxy = window.TitaniumAccelerometer;

Titanium.Accelerometer = {
	/**
	 * @tiapi(method=True,name=Accelerometer.addEventListener,since=0.4)
	 * @tiapi Listen for events from the accelerometer.
	 * @tiarg[string,eventName] The name of the event. This API supports 'update' events.
	 * @tiarg[function,listener] Function that receives an event object on each update.
	 * @tiresult[int] id to pass to removeEventListener to cancel the event.
	 */
	addEventListener : function(eventName, listener) {
		return Titanium.accelerometerProxy.addEventListener(eventName, registerCallback(this, listener));
	},
	/**
	 * @tiapi(method=True,name=Accelerometer.removeEventListener,since=0.4)
	 * @tiapi Remove a listener previously set with addEventListener.
	 * @tiarg[string,eventName] Name of the event used to register in addEventListener.
	 * @tiarg[int,listenerId] Value returned from addEventListener.
	 */
	removeEventListener : function(eventName, listenerId) {
		Titanium.accelerometerProxy.removeEventListener(eventName, listenerId);
	}
};

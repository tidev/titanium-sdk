define("Ti/App", ["Ti/_/Evented"], function(Evented) {

	(function(api){
		// Interfaces
		Ti._5.EventDriven(api);
	
		require.mix(api, require.config.app, {
			idleTimerDisabled: true,
			proximityDetection: false,
			proximityState: 0
		});
	
		// Methods
		api.getArguments = function(){
			console.debug('Method "Titanium.App.getArguments" is not implemented yet.');
		};
	})(Ti._5.createClass('Ti.App'));

});
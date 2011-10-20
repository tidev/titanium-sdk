(function(api){
	// Interfaces
	Ti._5.EventDriven(api);

	api.id = "__APP_ID__";
	api.name = "__APP_NAME__";
	api.version = "__APP_VERSION__";
	api.publisher = "__APP_PUBLISHER__";
	api.description = "__APP_DESCRIPTION__";
	api.copyright = "__APP_COPYRIGHT__";
	api.url = "__APP_URL__";
	api.guid = "__APP_GUID__";
	api.idleTimerDisabled = true;
	api.proximityDetection = false;
	api.proximityState = 0;
		
	var analytics = "__APP_ANALYTICS__";

	// Methods
	api.getArguments = function(){
		console.debug('Method "Titanium.App.getArguments" is not implemented yet.');
	};
})(Ti._5.createClass('Ti.App'));

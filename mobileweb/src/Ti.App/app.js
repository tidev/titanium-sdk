<%!
	def jsQuoteEscapeFilter(str):
		return str.replace("\"","\\\"")
%>
(function(api){
	// Interfaces
	Ti._5.EventDriven(api);

	api.id = "${app_id | jsQuoteEscapeFilter}";
	api.name = "${app_name | jsQuoteEscapeFilter}";
	api.version = "${app_version | jsQuoteEscapeFilter}";
	api.publisher = "${app_publisher | jsQuoteEscapeFilter}";
	api.description = "${app_description | jsQuoteEscapeFilter}";
	api.copyright = "${app_copyright | jsQuoteEscapeFilter}";
	api.url = "${app_url | jsQuoteEscapeFilter}";
	api.guid = "${app_guid | jsQuoteEscapeFilter}";
	api.idleTimerDisabled = true;
	api.proximityDetection = false;
	api.proximityState = 0;
		
	var analytics = "${app_analytics | jsQuoteEscapeFilter}";

	// Methods
	api.getArguments = function(){
		console.debug('Method "Titanium.App.getArguments" is not implemented yet.');
	};
})(Ti._5.createClass('Ti.App'));

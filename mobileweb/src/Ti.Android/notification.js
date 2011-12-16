(function(api){
	// Properties
	Ti._5.prop(api, 'audioStreamType');

	Ti._5.prop(api, 'contentIntent');

	Ti._5.prop(api, 'contentText');

	Ti._5.prop(api, 'contentTitle');

	Ti._5.prop(api, 'defaults');

	Ti._5.prop(api, 'deleteIntent');

	Ti._5.prop(api, 'flags');

	Ti._5.prop(api, 'icon');

	Ti._5.prop(api, 'ledARGB');

	Ti._5.prop(api, 'ledOffMS');

	Ti._5.prop(api, 'ledOnMS');

	Ti._5.prop(api, 'number');

	Ti._5.prop(api, 'sound');

	Ti._5.prop(api, 'tickerText');

	Ti._5.prop(api, 'when');

	// Methods
	api.setLatestEventInfo = function(){
		console.debug('Method "Titanium.Android.Notification.setLatestEventInfo" is not implemented yet.');
	};
})(Ti._5.createClass('Titanium.Android.Notification'));
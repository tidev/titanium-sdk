/*global Ti */
var service = Ti.Android.currentService;
var intent = service.getIntent();
var teststring = intent.getStringExtra('message') + ' (instance ' + service.serviceInstanceId + ')';
Ti.App.fireEvent('test_service_fire', { message: teststring});

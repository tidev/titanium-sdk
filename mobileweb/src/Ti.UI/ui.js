(function(api){
	var _backgroundColor = null,
		_backgroundImage = null;

	api.currentWindow = null;
	api.currentTab = null;

	// Properties
	Ti._5.propReadOnly(api, {
		UNKNOWN: 0,
		FACE_DOWN: 1,
		FACE_UP: 2,
		PORTRAIT: 3,
		UPSIDE_PORTRAIT: 4,
		LANDSCAPE_LEFT: 5,
		LANDSCAPE_RIGHT: 6,
		INPUT_BORDERSTYLE_BEZEL: 3,
		INPUT_BORDERSTYLE_LINE: 1,
		INPUT_BORDERSTYLE_NONE: 0,
		INPUT_BORDERSTYLE_ROUNDED: 2,
		INPUT_BUTTONMODE_ALWAYS: 1,
		INPUT_BUTTONMODE_NEVER: 0,
		INPUT_BUTTONMODE_ONBLUR: 0,
		INPUT_BUTTONMODE_ONFOCUS: 1,
		KEYBOARD_APPEARANCE_ALERT: 1,
		KEYBOARD_APPEARANCE_DEFAULT: 0,
		KEYBOARD_ASCII: 1,
		KEYBOARD_DEFAULT: 2,
		KEYBOARD_EMAIL: 3,
		KEYBOARD_NAMEPHONE_PAD: 4,
		KEYBOARD_NUMBERS_PUNCTUATION: 5,
		KEYBOARD_NUMBER_PAD: 6,
		KEYBOARD_PHONE_PAD: 7,
		KEYBOARD_URL: 8,
		NOTIFICATION_DURATION_LONG: 1,
		NOTIFICATION_DURATION_SHORT: 2,
		PICKER_TYPE_COUNT_DOWN_TIMER: 1,
		PICKER_TYPE_DATE: 2,
		PICKER_TYPE_DATE_AND_TIME: 3,
		PICKER_TYPE_PLAIN: 4,
		PICKER_TYPE_TIME: 5,
		RETURNKEY_DEFAULT: 0,
		RETURNKEY_DONE: 1,
		RETURNKEY_EMERGENCY_CALL: 2,
		RETURNKEY_GO: 3,
		RETURNKEY_GOOGLE: 4,
		RETURNKEY_JOIN: 5,
		RETURNKEY_NEXT: 6,
		RETURNKEY_ROUTE: 7,
		RETURNKEY_SEARCH: 8,
		RETURNKEY_SEND: 9,
		RETURNKEY_YAHOO: 10,
		TEXT_ALIGNMENT_CENTER: 1,
		TEXT_ALIGNMENT_RIGHT: 2,
		TEXT_ALIGNMENT_LEFT: 3,
		TEXT_AUTOCAPITALIZATION_ALL: 3,
		TEXT_AUTOCAPITALIZATION_NONE: 0,
		TEXT_AUTOCAPITALIZATION_SENTENCES: 2,
		TEXT_AUTOCAPITALIZATION_WORDS: 1,
		TEXT_VERTICAL_ALIGNMENT_BOTTOM: 2,
		TEXT_VERTICAL_ALIGNMENT_CENTER: 1,
		TEXT_VERTICAL_ALIGNMENT_TOP: 3
	});

	Ti._5.prop(api, {
		backgroundColor: {
			get: function(){return _backgroundColor;},
			set: function(val){
				_backgroundColor = val;
				api.setBackgroundColor(_backgroundColor);
			}
		},
		backgroundImage: {
			get: function(){return _backgroundImage;},
			set: function(val){
				_backgroundImage = val;
				api.setBackgroundImage(_backgroundImage);
			}
		}
	});

	// Methods
	api.setBackgroundColor = function(args) {
		Ti._5.containerDiv.style.backgroundColor = args;
	};
	
	api.setBackgroundImage = function(args) {
		Ti._5.containerDiv.style.backgroundImage = "url(" + Ti._5.getAbsolutePath(args) + ")";
	};
	
	api.create2DMatrix = function(args){
		return new Ti.UI["2DMatrix"](args);
	};
	api.create3DMatrix = function(){
		console.debug('Method "Titanium.UI.create3DMatrix" is not implemented yet.');
	};
	api.createActivityIndicator = function(args){
		return new Ti.UI.ActivityIndicator(args);
	};
	api.createAlertDialog = function(args){
		return new Ti.UI.AlertDialog(args);
	};
	api.createAnimation = function(args){
		return new Ti.UI.Animation(args);
	};
	api.createButton = function(args) {
		return new Ti.UI.Button(args);
	};
	api.createButtonBar = function(){
		console.debug('Method "Titanium.UI.createButtonBar" is not implemented yet.');
	};
	api.createCoverFlowView = function(){
		console.debug('Method "Titanium.UI.createCoverFlowView" is not implemented yet.');
	};
	api.createDashboardItem = function(){
		console.debug('Method "Titanium.UI.createDashboardItem" is not implemented yet.');
	};
	api.createDashboardView = function(){
		console.debug('Method "Titanium.UI.createDashboardView" is not implemented yet.');
	};
	api.createEmailDialog = function(){
		console.debug('Method "Titanium.UI.createEmailDialog" is not implemented yet.');
	};
	api.createImageView = function(args){
		return new Ti.UI.ImageView(args);
	};
	api.createLabel = function(args) {
		return new Ti.UI.Label(args);
	};
	api.createOptionDialog = function(){
		console.debug('Method "Titanium.UI.createOptionDialog" is not implemented yet.');
	};
	api.createPicker = function(args) {
		return new Ti.UI.Picker(args);
	}
	api.createPickerColumn = function(){
		console.debug('Method "Titanium.UI.createPickerColumn" is not implemented yet.');
	};
	api.createPickerRow = function(args){
		return new Ti.UI.PickerRow(args);
	};
	api.createProgressBar = function(){
		console.debug('Method "Titanium.UI.createProgressBar" is not implemented yet.');
	};
	api.createScrollView = function(args) {
		return new Ti.UI.ScrollView(args);
	};
	api.createScrollableView = function(args){
		return new Ti.UI.ScrollableView(args);
	};
	api.createSearchBar = function(args){
		return new Ti.UI.SearchBar(args);
	};
	api.createSlider = function(args){
		return new Ti.UI.Slider(args);
	};
	api.createSwitch = function(args){
		return new Ti.UI.Switch(args);
	};
	api.createTab = function(args){
		return new Ti.UI.Tab(args);
	};
	api.createTabGroup = function(args){
		return new Ti.UI.TabGroup(args);
	};
	api.createTabbedBar = function(){
		console.debug('Method "Titanium.UI.createTabbedBar" is not implemented yet.');
	};
	api.createTableView = function(args) {
		return new Ti.UI.TableView(args);
	};
	api.createTableViewRow = function(args){
		return new Ti.UI.TableViewRow(args);
	};
	api.createTableViewSection = function(args){
		return new Ti.UI.TableViewSection(args);
	};
	api.createTextArea = function(args) {
		return new Ti.UI.TextArea(args);
	};
	api.createTextField = function(args) {
		return new Ti.UI.TextField(args);
	};
	api.createToolbar = function(){
		console.debug('Method "Titanium.UI.createToolbar" is not implemented yet.');
	};
	api.createView = function(args) {
		return new Ti.UI.View(args);
	};
	api.createWebView = function(args) {
		return new Ti.UI.WebView(args);
	};
	api.createWindow = function(args) {
		return new Ti.UI.Window(args);
	};
})(Ti._5.createClass("Ti.UI"));

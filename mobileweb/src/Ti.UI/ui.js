(function(api){
	api.currentWindow = null;
	api.currentTab = null;
	
	// Properties
	api.ANIMATION_CURVE_EASE_IN = 2;		// deprecated since 1.8.0
	api.ANIMATION_CURVE_EASE_IN_OUT = 4;	// deprecated since 1.8.0
	api.ANIMATION_CURVE_EASE_OUT = 3;		// deprecated since 1.8.0
	api.ANIMATION_CURVE_LINEAR = 1;			// deprecated since 1.8.0
	api.AUTODETECT_ADDRESS = 1;				// deprecated since 1.8.0
	api.AUTODETECT_ALL = 0;					// deprecated since 1.8.0
	api.AUTODETECT_CALENDAR = 2;			// deprecated since 1.8.0
	api.AUTODETECT_LINK = 3;				// deprecated since 1.8.0
	api.AUTODETECT_NONE = -1;				// deprecated since 1.8.0
	api.AUTODETECT_PHONE = 4;				// deprecated since 1.8.0
	api.BLEND_MODE_CLEAR = -1;				// deprecated since 1.8.0
	api.BLEND_MODE_COLOR = 1;				// deprecated since 1.8.0
	api.BLEND_MODE_COLOR_BURN = 2;			// deprecated since 1.8.0
	api.BLEND_MODE_COLOR_DODGE = 3;			// deprecated since 1.8.0
	api.BLEND_MODE_COPY = 4;				// deprecated since 1.8.0
	api.BLEND_MODE_DARKEN = 5;				// deprecated since 1.8.0
	api.BLEND_MODE_DESTINATION_ATOP = 6;	// deprecated since 1.8.0
	api.BLEND_MODE_DESTINATION_IN = 7;
	api.BLEND_MODE_DESTINATION_OUT = 8;		// deprecated since 1.8.0
	api.BLEND_MODE_DESTINATION_OVER = 9;	// deprecated since 1.8.0
	api.BLEND_MODE_DIFFERENCE = 10;			// deprecated since 1.8.0
	api.BLEND_MODE_EXCLUSION = 11;			// deprecated since 1.8.0
	api.BLEND_MODE_HARD_LIGHT = 12;			// deprecated since 1.8.0
	api.BLEND_MODE_HUE = 13;				// deprecated since 1.8.0
	api.BLEND_MODE_LIGHTEN = 14;			// deprecated since 1.8.0
	api.BLEND_MODE_LUMINOSITY = 15;			// deprecated since 1.8.0
	api.BLEND_MODE_MULTIPLY = 16;			// deprecated since 1.8.0
	api.BLEND_MODE_NORMAL = 0;				// deprecated since 1.8.0
	api.BLEND_MODE_OVERLAY = 17;			// deprecated since 1.8.0
	api.BLEND_MODE_PLUS_DARKER = 18;		// deprecated since 1.8.0
	api.BLEND_MODE_PLUS_LIGHTER = 19;		// deprecated since 1.8.0
	api.BLEND_MODE_SATURATION = 20;			// deprecated since 1.8.0
	api.BLEND_MODE_SCREEN = 21;				// deprecated since 1.8.0
	api.BLEND_MODE_SOFT_LIGHT = 22;			// deprecated since 1.8.0
	api.BLEND_MODE_PLUS_LIGHTER = 23;		// deprecated since 1.8.0
	api.BLEND_MODE_SATURATION = 24;			// deprecated since 1.8.0
	api.BLEND_MODE_SCREEN = 25;				// deprecated since 1.8.0
	api.BLEND_MODE_SOFT_LIGHT = 26;			// deprecated since 1.8.0
	api.BLEND_MODE_SOURCE_ATOP = 27;		// deprecated since 1.8.0
	api.BLEND_MODE_SOURCE_IN = 28;			// deprecated since 1.8.0
	api.BLEND_MODE_SOURCE_OUT = 29;			// deprecated since 1.8.0
	api.BLEND_MODE_XOR = 30;				// deprecated since 1.8.0

	api.FACE_DOWN = 1;
	api.FACE_UP = 2;
	api.PORTRAIT = 3;
	api.UPSIDE_PORTRAIT = 4;
	api.LANDSCAPE_LEFT = 5;
	api.LANDSCAPE_RIGHT = 6;

	api.INPUT_BORDERSTYLE_BEZEL = 3;
	api.INPUT_BORDERSTYLE_LINE = 1;
	api.INPUT_BORDERSTYLE_NONE = 0;
	api.INPUT_BORDERSTYLE_ROUNDED = 2;
	api.INPUT_BUTTONMODE_ALWAYS = 1;
	api.INPUT_BUTTONMODE_NEVER = 0;
	api.INPUT_BUTTONMODE_ONBLUR = 0;
	api.INPUT_BUTTONMODE_ONFOCUS = 1;
	api.KEYBOARD_APPEARANCE_ALERT = 1;
	api.KEYBOARD_APPEARANCE_DEFAULT = 0;
	api.KEYBOARD_ASCII = 1;
	api.KEYBOARD_DEFAULT = 2;
	api.KEYBOARD_EMAIL = 3;
	api.KEYBOARD_NAMEPHONE_PAD = 4;
	api.KEYBOARD_NUMBERS_PUNCTUATION = 5;
	api.KEYBOARD_NUMBER_PAD = 6;
	api.KEYBOARD_PHONE_PAD = 7;
	api.KEYBOARD_URL = 8;
	api.NOTIFICATION_DURATION_LONG = 1;
	api.NOTIFICATION_DURATION_SHORT = 2;
	api.PICKER_TYPE_COUNT_DOWN_TIMER = 1;
	api.PICKER_TYPE_DATE = 2;
	api.PICKER_TYPE_DATE_AND_TIME = 3;
	api.PICKER_TYPE_PLAIN = 4;
	api.PICKER_TYPE_TIME = 5;
	api.RETURNKEY_DEFAULT = 0;
	api.RETURNKEY_DONE = 1;
	api.RETURNKEY_EMERGENCY_CALL = 2;
	api.RETURNKEY_GO = 3;
	api.RETURNKEY_GOOGLE = 4;
	api.RETURNKEY_JOIN = 5;
	api.RETURNKEY_NEXT = 6;
	api.RETURNKEY_ROUTE = 7;
	api.RETURNKEY_SEARCH = 8;
	api.RETURNKEY_SEND = 9;
	api.RETURNKEY_YAHOO = 10;
	api.TEXT_ALIGNMENT_CENTER = 1;
	api.TEXT_ALIGNMENT_RIGHT = 2;
	api.TEXT_ALIGNMENT_LEFT = 3;
	api.TEXT_AUTOCAPITALIZATION_ALL = 3;
	api.TEXT_AUTOCAPITALIZATION_NONE = 0;
	api.TEXT_AUTOCAPITALIZATION_SENTENCES = 2;
	api.TEXT_AUTOCAPITALIZATION_WORDS = 1;
	api.TEXT_VERTICAL_ALIGNMENT_BOTTOM = 2;
	api.TEXT_VERTICAL_ALIGNMENT_CENTER = 1;
	api.TEXT_VERTICAL_ALIGNMENT_TOP = 3;
	api.UNKNOWN = 0;

	var _backgroundColor = null;
	Ti._5.prop(api, "backgroundColor", {
		get: function(){return _backgroundColor;},
		set: function(val){
			_backgroundColor = val;
			api.setBackgroundColor(_backgroundColor);
		}
	});

	var _backgroundImage = null;
	Ti._5.prop(api, "backgroundImage", {
		get: function(){return _backgroundImage;},
		set: function(val){
			_backgroundImage = val;
			api.setBackgroundImage(_backgroundImage);
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
		return new Titanium.UI["2DMatrix"](args);
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
})(Ti._5.createClass("Titanium.UI"));

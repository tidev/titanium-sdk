/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium;

/**
 * A comprehensive list of global Titanium events and properties constants.
 * These are sorted alphabetically.
 */
public class TiC
{
	public static final int API_LEVEL_HONEYCOMB = 11;
	public static final int API_LEVEL_ICE_CREAM_SANDWICH = 14;
	public static final String ERROR_PROPERTY_CODE = "code";
	public static final String ERROR_PROPERTY_ERRORCODE = "errorcode";
	public static final String ERROR_PROPERTY_MESSAGE = "message";

	/**
	 * @module.api
	 */
	public static final String EVENT_ADDED_TO_TAB = "addedToTab";

	/**
	 * @module.api
	 */
	public static final String EVENT_ANDROID_BACK = "android:back";

	/**
	 * @module.api
	 */
	public static final String EVENT_ANDROID_CAMERA = "android:camera";

	/**
	 * @module.api
	 */
	public static final String EVENT_ANDROID_FOCUS = "android:focus";

	/**
	 * @module.api
	 */
	public static final String EVENT_ANDROID_SEARCH = "android:search";

	/**
	 * @module.api
	 */
	public static final String EVENT_ANDROID_VOLDOWN = "android:voldown";

	/**
	 * @module.api
	 */
	public static final String EVENT_ANDROID_VOLUP = "android:volup";

	/**
	 * @module.api
	 */
	public static final String EVENT_BATTERY = "battery";

	/**
	 * @module.api
	 */
	public static final String EVENT_BLUR = "blur";

	/**
	 * @module.api
	 */
	public static final String EVENT_CANCEL = "cancel";

	/**
	 * @module.api
	 */
	public static final String EVENT_COLLAPSE = "collapse";

	/**
	 * @module.api
	 */
	public static final String EVENT_CHANGE = "change";

	/**
	 * @module.api
	 */
	public static final String EVENT_CLICK = "click";

	/**
	 * @module.api
	 */
	public static final String EVENT_CLOSE = "close";

	/**
	 * @module.api
	 */
	public static final String EVENT_COMPLETE = "complete";

	/**
	 * @module.api
	 */
	public static final String EVENT_CREATE = "create";

	/**
	 * @module.api
	 */
	public static final String EVENT_DESTROY = "destroy";

	/**
	 * @module.api
	 */
	public static final String EVENT_DOUBLE_CLICK = "dblclick";

	/**
	 * @module.api
	 */
	public static final String EVENT_DOUBLE_TAP = "doubletap";

	/**
	 * @module.api
	 */
	public static final String EVENT_DURATION_AVAILABLE = "durationAvailable";

	/**
	 * @module.api
	 */
	public static final String EVENT_ERROR = "error";

	/**
	 * @module.api
	 */
	public static final String EVENT_EXPAND = "expand";

	/**
	 * @module.api
	 */
	public static final String EVENT_FOCUS = "focus";

	/**
	 * @module.api
	 */
	public static final String EVENT_FOCUSED = "focused";

	/**
	 * @module.api
	 */
	public static final String EVENT_HEADING = "heading";

	/**
	 * @module.api
	 */
	public static final String EVENT_LOAD = "load";

	/**
	 * @module.api
	 */
	public static final String EVENT_LOADSTATE = "loadstate";

	/**
	 * @module.api
	 */
	public static final String EVENT_LOCATION = "location";

	/**
	 * @module.api
	 */
	public static final String EVENT_LONGCLICK = "longclick";

	/**
	 * @module.api
	 */
	public static final String EVENT_LONGPRESS = "longpress";

	/**
	 * @module.api
	 */
	public static final String EVENT_NEW_INTENT = "newIntent";

	/**
	 * @module.api
	 */
	public static final String EVENT_OPEN = "open";

	/**
	 * @module.api
	 */
	public static final String EVENT_PAUSE = "pause";

	/**
	 * @module.api
	 */
	public static final String EVENT_PINCH = "pinch";	

	/**
	 * @module.api
	 */
	public static final String EVENT_PLAYBACK_STATE = "playbackState";

	/**
	 * @module.api
	 */
	public static final String EVENT_PRELOAD = "preload";

	/**
	 * @module.api
	 */
	public static final String EVENT_POST_LAYOUT = "postlayout";

	/**
	 * @module.api
	 */
	public static final String EVENT_PROPERTY_CLICKSOURCE = "clicksource";

	/**
	 * @module.api
	 */
	public static final String EVENT_PROPERTY_CURRENT_PLAYBACK_TIME = "currentPlaybackTime";

	/**
	 * @module.api
	 */
	public static final String EVENT_PROPERTY_DETAIL = "detail";

	/**
	 * @module.api
	 */
	public static final String EVENT_PROPERTY_DIRECTION = "direction";

	/**
	 * @module.api
	 */
	public static final String EVENT_PROPERTY_ERROR = "error";

	/**
	 * @module.api
	 */
	public static final String EVENT_PROPERTY_INDEX = "index";

	/**
	 * @module.api
	 */
	public static final String EVENT_PROPERTY_INTENT = "intent";

	/**
	 * @module.api
	 */
	public static final String EVENT_PROPERTY_IS_DIALOG = "isDialog";

	/**
	 * @module.api
	 */
	public static final String EVENT_PROPERTY_IS_USER_GESTURE = "isUserGesture";

	/**
	 * @module.api
	 */
	public static final String EVENT_PROPERTY_LAYOUT_NAME = "layoutName";

	/**
	 * @module.api
	 */
	public static final String EVENT_PROPERTY_LOADSTATE = "loadState";

	/**
	 * @module.api
	 */
	public static final String EVENT_PROPERTY_MENU = "menu";

	/**
	 * @module.api
	 */
	public static final String EVENT_PROPERTY_MESSAGE = "message";

	/**
	 * @module.api
	 */
	public static final String EVENT_PROPERTY_PLAYBACK_STATE = EVENT_PLAYBACK_STATE;

	/**
	 * @module.api
	 */
	public static final String EVENT_PROPERTY_PREVIOUS_INDEX = "previousIndex";

	/**
	 * @module.api
	 */
	public static final String EVENT_PROPERTY_PREVIOUS_TAB = "previousTab";

	/**
	 * @module.api
	 */
	public static final String EVENT_PROPERTY_REASON = "reason";

	/**
	 * @module.api
	 */
	public static final String EVENT_PROPERTY_REQUEST_CODE = "requestCode";

	/**
	 * @module.api
	 */
	public static final String EVENT_PROPERTY_RESULT_CODE = "resultCode";

	/**
	 * @module.api
	 */
	public static final String EVENT_PROPERTY_ROW = "row";

	/**
	 * @module.api
	 */
	public static final String EVENT_PROPERTY_SCALE = "scale";

	/**
	 * @module.api
	 */
	public static final String EVENT_PROPERTY_SEARCH_MODE = "searchMode";

	/**
	 * @module.api
	 */
	public static final String EVENT_PROPERTY_SOURCE = "source";

	/**
	 * @module.api
	 */
	public static final String EVENT_PROPERTY_STATE = "state";

	/**
	 * @module.api
	 */
	public static final String EVENT_PROPERTY_TAB = "tab";

	/**
	 * @module.api
	 */
	public static final String EVENT_PROPERTY_THUMB_OFFSET = "thumbOffset";

	/**
	 * @module.api
	 */
	public static final String EVENT_PROPERTY_THUMB_SIZE = "thumbSize";

	/**
	 * @module.api
	 */
	public static final String EVENT_PROPERTY_TYPE = "type";

	/**
	 * @module.api
	 */
	public static final String EVENT_PROPERTY_VELOCITY = "velocity";

	/**
	 * @module.api
	 */
	public static final String EVENT_PROPERTY_X = "x";

	/**
	 * @module.api
	 */
	public static final String EVENT_PROPERTY_Y = "y";

	/**
	 * @module.api
	 */
	public static final String EVENT_REGION_CHANGED = "regionChanged";

	/**
	 * @module.api
	 */
	public static final String EVENT_RESTART = "restart";

	/**
	 * @module.api
	 */
	public static final String EVENT_RESUME = "resume";

	/**
	 * @module.api
	 */
	public static final String EVENT_SCROLL = "scroll";

	/**
	 * @module.api
	 */
	public static final String EVENT_SCROLLEND = "scrollEnd";

	/**
	 * @module.api
	 */
	public static final String EVENT_DRAGEND = "dragEnd";

	/**
	 * @module.api
	 */
	public static final String EVENT_SINGLE_TAP = "singletap";

	/**
	 * @module.api
	 */
	public static final String EVENT_START = "start";

	/**
	 * @module.api
	 */
	public static final String EVENT_STOP = "stop";

	/**
	 * @module.api
	 */
	public static final String EVENT_SWIPE = "swipe";

	/**
	 * @module.api
	 */
	public static final String EVENT_TOUCH_CANCEL = "touchcancel";

	/**
	 * @module.api
	 */
	public static final String EVENT_TOUCH_END = "touchend";

	/**
	 * @module.api
	 */
	public static final String EVENT_TOUCH_MOVE = "touchmove";

	/**
	 * @module.api
	 */
	public static final String EVENT_TOUCH_START = "touchstart";

	/**
	 * @module.api
	 */
	public static final String EVENT_UNFOCUSED = "unfocused";
	public static final String INTENT_PROPERTY_FINISH_ROOT = "finishRoot";
	public static final String INTENT_PROPERTY_IS_TAB = "isTab";
	public static final String INTENT_PROPERTY_LAYOUT = "layout";
	public static final String INTENT_PROPERTY_MESSENGER = "messenger";
	public static final String INTENT_PROPERTY_MSG_ACTIVITY_CREATED_ID = "msgActivityCreatedId";
	public static final String INTENT_PROPERTY_MSG_ID = "messageId";
	public static final String INTENT_PROPERTY_START_MODE = "startMode";
	public static final String INTENT_PROPERTY_USE_ACTIVITY_WINDOW = "useActivityWindow";
	public static final String INTENT_PROPERTY_WINDOW_ID = "windowId";
	public static final String LAYOUT_FILL = "fill";
	public static final String LAYOUT_HORIZONTAL = "horizontal";
	public static final String LAYOUT_SIZE = "size";
	public static final String LAYOUT_VERTICAL = "vertical";
	public static final String MSG_PROPERTY_EVENT_NAME = "eventName";
	public static final String MSG_PROPERTY_FILENAME = "filename";
	public static final String MSG_PROPERTY_SRC = "src";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_ACCURACY = "accuracy";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_SCROLLING_ENABLED = "scrollingEnabled";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_ACTION = "action";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_ACTIVE_TAB = "activeTab";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_ACTIVITY = "activity";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_ADDRESS = "address";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_ALLOW_BACKGROUND = "allowBackground";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_ALTITUDE = "altitude";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_ALTITUDE_ACCURACY = "altitudeAccuracy";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_ANCHOR_POINT = "anchorPoint";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_ANDROID_VIEW = "androidView";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_ANIMATE = "animate";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_ANIMATED = "animated";
	
	/**
	 * @module.api
	 */
	public static final String PROPERTY_ANNIVERSARY = "anniversary";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_ANNOTATION = "annotation";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_ANNOTATIONS = "annotations";
	
	/**
	 * @module.api
	 */
	public static final String PROPERTY_ASSISTANT = "assistant";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_AUDIO_STREAM_TYPE = "audioStreamType";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_AUTO_LINK = "autoLink";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_AUTOCAPITALIZATION = "autocapitalization";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_AUTOCORRECT = "autocorrect";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_AUTOPLAY = "autoplay";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_AUTOREVERSE = "autoreverse";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_BACKGROUND_COLOR = "backgroundColor";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_BACKGROUND_DISABLED_COLOR = "backgroundDisabledColor";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_BACKGROUND_DISABLED_IMAGE = "backgroundDisabledImage";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_BACKGROUND_FOCUSED_COLOR = "backgroundFocusedColor";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_BACKGROUND_FOCUSED_IMAGE = "backgroundFocusedImage";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_BACKGROUND_GRADIENT = "backgroundGradient";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_BACKGROUND_IMAGE = "backgroundImage";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_BACKGROUND_PADDING = "backgroundPadding";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_BACKGROUND_PREFIX = "background";

	public static final String PROPERTY_BACKGROUND_REPEAT = "backgroundRepeat";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_BACKGROUND_SELECTED_COLOR = "backgroundSelectedColor";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_BACKGROUND_SELECTED_IMAGE = "backgroundSelectedImage";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_BASE_URL = "baseUrl";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_BASE_URL_WEBVIEW = "baseURL";
	
	/**
	 * @module.api
	 */
	public static final String PROPERTY_BIRTHDAY = "birthday";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_BORDER_COLOR = "borderColor";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_BORDER_PREFIX = "border";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_BORDER_RADIUS = "borderRadius";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_BORDER_WIDTH = "borderWidth";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_BOTTOM = "bottom";
	
	/**
	 * @module.api
	 */
	public static final String PROPERTY_BROTHER = "bottom";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_BUTTON = "button";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_BUTTON_NAMES = "buttonNames";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_BYTE_ORDER = "byteOrder";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_CAN_SCALE = "canScale";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_CAN_CANCEL_EVENTS = "canCancelEvents";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_CANCEL = "cancel";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_CANCELABLE = "cancelable";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_CENTER = "center";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_CHARSET = "charset";
	
	/**
	 * @module.api
	 */
	public static final String PROPERTY_CHILD = "child";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_CITY = "city";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_CLASS_NAME = "className";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_CLASS_NAMES = "classNames";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_CLEAR_ON_EDIT = "clearOnEdit";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_CODE = "code";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_COLOR = "color";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_COORDS = "coords";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_CONTENT_HEIGHT = "contentHeight";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_CONTENT_INTENT = "contentIntent";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_CONTENT_OFFSET = "contentOffset";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_CONTENT_TEXT = "contentText";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_CONTENT_TITLE = "contentTitle";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_CONTENT_URL = "contentURL";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_CONTENT_VIEW = "contentView";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_CONTENT_WIDTH = "contentWidth";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_COUNT = "count";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_COUNTRY = "country";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_COUNTRY_CODE = "country_code";

	/**
	 * @module.api
	 */ // TIMOB-4478
	public static final String PROPERTY_CURRENT_PAGE = "currentPage";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_DATA = "data";
	
	/**
	 * @module.api
	 */
	public static final String PROPERTY_DATE = "date";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_DEFAULT_IMAGE = "defaultImage";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_DEFAULTS = "defaults";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_DELAY = "delay";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_DELETE_INTENT = "deleteIntent";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_DEST = "dest";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_DEST_POSITION = "destPosition";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_DIRECTION = "direction";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_DISPLAY_ADDRESS = "displayAddress";
	
	/**
	 * @module.api
	 */
	public static final String PROPERTY_DOMESTIC_PARTNER = "domesticPartner";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_DURATION = "duration";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_EDITABLE = "editable";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_ELLIPSIZE = "ellipsize";
	
	/**
	 * @module.api
	 */
	public static final String PROPERTY_EMAIL = "email";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_ENABLE_ZOOM_CONTROLS = "enableZoomControls";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_ENABLED = "enabled";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_ENABLE_RETURN_KEY = "enableReturnKey";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_END_PLAYBACK_TIME = "endPlaybackTime";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_EVENT = "event";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_EXIT_ON_CLOSE = "exitOnClose";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_FATHER = "father";
	
	/**
	 * @module.api
	 */
	public static final String PROPERTY_FILE = "file";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_FILTER_ATTRIBUTE = "filterAttribute";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_FILTER_CASE_INSENSITIVE = "filterCaseInsensitive";
	
	/**
	 * @module.api
	 */
	public static final String PROPERTY_FIRSTNAME = "firstName";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_FLAGS = "flags";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_FOCUSABLE = "focusable";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_FONT = "font";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_FONT_FAMILY = "font-family";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_FONT_WEIGHT = "font-weight";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_FONT_SIZE = "font-size";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_FOOTER = "footer";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_FOOTER_TITLE = "footerTitle";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_FOOTER_VIEW = "footerView";

	public static final String PROPERTY_FORWARD = "forward";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_FREQUENCY = "frequency";
	
	/**
	 * @module.api
	 */
	public static final String PROPERTY_FRIEND = "friend";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_FROM = "from";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_FULLNAME = "fullname";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_FULLSCREEN = "fullscreen";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_GROUP_ID = "groupId";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_HAS_CHECK = "hasCheck";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_HAS_CHILD = "hasChild";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_HEADER = "header";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_HEADER_TITLE = "headerTitle";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_HEADER_VIEW = "headerView";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_HEADING = "heading";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_HEADING_FILTER = "headingFilter";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_HEIGHT = "height";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_HIGHLIGHTED_COLOR = "highlightedColor";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_HINT_TEXT = "hintText";
	
	/**
	 * @module.api
	 */
	public static final String PROPERTY_HOME = "home";
	
	/**
	 * @module.api
	 */
	public static final String PROPERTY_HOMEPAGE = "homepage";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_HTML = "html";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_ICON = "icon";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_ICON_LEVEL = "iconLevel";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_ID = "id";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_IMAGE = "image";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_IMAGES = "images";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_INITIAL_PLAYBACK_TIME = "initialPlaybackTime";
	
	/**
	 * @module.api
	 */
	public static final String PROPERTY_INSTANTMSG = "instantMessage";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_INTENT = "intent";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_ITEM_ID = "itemId";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_KEEP_SCREEN_ON = "keepScreenOn";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_KEYBOARD_TYPE = "keyboardType";
	
	/**
	 * @module.api
	 */
	public static final String PROPERTY_LASTNAME = "lastName";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_LATITUDE = "latitude";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_LATITUDE_DELTA = "latitudeDelta";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_LAYOUT = "layout";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_LAYOUT_ID = "layoutId";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_LED_ARGB = "ledARGB";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_LED_OFF_MS = "ledOffMS";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_LED_ON_MS = "ledOnMS";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_LEFT = "left";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_LEFT_BUTTON = "leftButton";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_LEFT_IMAGE = "leftImage";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_LEFT_VIEW = "leftView";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_LENGTH = "length";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_LEVEL = "level";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_LOCATION = "location";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_LONGITUDE = "longitude";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_LONGITUDE_DELTA = "longitudeDelta";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_MAGNETIC_HEADING = "magneticHeading";
	
	/**
	 * @module.api
	 */
	public static final String PROPERTY_MANAGER = "manager";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_MAP_TYPE = "mapType";

	public static final String PROPERTY_MAX_AGE = "maxAge";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_MEDIA_CONTROL_STYLE = "mediaControlStyle";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_MENU = EVENT_PROPERTY_MENU;

	/**
	 * @module.api
	 */
	public static final String PROPERTY_MESSAGE = "message";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_MESSAGEID = "messageid";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_MESSENGER = "messenger";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_MESSENGER_RECEIVER = "messengerReceiver";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_MIMETYPE = "mimeType";
	
	/**
	 * @module.api
	 */
	public static final String PROPERTY_MIDDLENAME = "middleName";

	public static final String PROPERTY_MIN_AGE = "minAge";
	public static final String PROPERTY_MIN_UPDATE_DISTANCE = "minUpdateDistance";
	public static final String PROPERTY_MIN_UPDATE_TIME = "minUpdateTime";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_MIN_ROW_HEIGHT = "minRowHeight";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_MINUTE_INTERVAL = "minuteInterval";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_MOBILE = "mobile";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_MODAL = "modal";
	
	/**
	 * @module.api
	 */
	public static final String PROPERTY_MOTHER = "mother";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_NAME = "name";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_NAV_BAR_HIDDEN = "navBarHidden";
	
	/**
	 * @module.api
	 */
	public static final String PROPERTY_NICKNAME = "nickname";
	
	/**
	 * @module.api
	 */
	public static final String PROPERTY_NOTE = "note";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_NUMBER = "number";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_OK = "ok";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_OKID = "okid";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_ON_CREATE_OPTIONS_MENU = "onCreateOptionsMenu";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_ON_PREPARE_OPTIONS_MENU = "onPrepareOptionsMenu";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_ON_CREATE_WINDOW = "onCreateWindow";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_OPACITY = "opacity";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_OPTIONS = "options";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_ORDER = "order";
	
	/**
	 * @module.api
	 */
	public static final String PROPERTY_ORGANIZATION = "organization";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_ORIENTATION_MODES = "orientationModes";
	
	/**
	 * @module.api
	 */
	public static final String PROPERTY_OTHER = "other";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_PACKAGE_NAME = "packageName";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_PAGING_CONTROL_TIMEOUT = "pagingControlTimeout";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_PARENT = "parent";
	
	/**
	 * @module.api
	 */
	public static final String PROPERTY_PARTNER = "partner";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_PASSWORD_MASK = "passwordMask";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_PHONE = "phone";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_PIN_IMAGE = "pinImage";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_PINCOLOR = "pincolor";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_PLACES = "places";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_PLAY = "play";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_PLUGIN_STATE = "pluginState";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_POSITION = "position";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_POSTAL_CODE = "postalCode";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_POWER = "power";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_PREFERRED_PROVIDER = "preferredProvider";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_PLAYABLE_DURATION = "playableDuration";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_PROVIDER = "provider";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_REFERRED_BY = "referredBy";
	
	/**
	 * @module.api
	 */
	public static final String PROPERTY_REGION = "region";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_REGION1 = "region1";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_REGION2 = "region2";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_REGION_FIT = "regionFit";
	
	/**
	 * @module.api
	 */
	public static final String PROPERTY_RELATED_NAMES = "relatedNames";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_REPEAT = "repeat";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_REPEAT_COUNT = "repeatCount";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_RETURN_KEY_TYPE = "returnKeyType";

	public static final String PROPERTY_REVERSE = "reverse";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_RIGHT = "right";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_RIGHT_BUTTON = "rightButton";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_RIGHT_IMAGE = "rightImage";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_RIGHT_VIEW = "rightView";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_ROTATE = "rotate";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_ROW_DATA = "rowData";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_ROW_HEIGHT = "rowHeight";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_SCALE = "scale";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_SCALING_MODE = "scalingMode";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_SCALES_PAGE_TO_FIT = "scalesPageToFit";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_SCROLL_ENABLED = "scrollEnabled";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_SCROLL_TYPE = "scrollType";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_SEARCH = "search";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_SECTION = "section";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_SELECTED_BACKGROUND_COLOR = "selectedBackgroundColor";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_SELECTED_BACKGROUND_IMAGE = "selectedBackgroundImage";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_SELECTED_INDEX = "selectedIndex";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_SELECTION_INDICATOR = "selectionIndicator";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_SEPARATOR_COLOR = "separatorColor";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_SHADOW_COLOR = "shadowColor";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_SHADOW_OFFSET = "shadowOffset";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_SHOW_HORIZONTAL_SCROLL_INDICATOR = "showHorizontalScrollIndicator";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_SHOW_VERTICAL_SCROLL_INDICATOR = "showVerticalScrollIndicator";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_SHOW_PAGING_CONTROL = "showPagingControl";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_SHOW_PROGRESS = "showProgress";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_SISTER = "sister";
	
	/**
	 * @module.api
	 */
	public static final String PROPERTY_SIZE = "size";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_SOFT_KEYBOARD_ON_FOCUS = "softKeyboardOnFocus";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_SOUND = "sound";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_SPEED = "speed";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_SOURCE = EVENT_PROPERTY_SOURCE;

	/**
	 * @module.api
	 */
	public static final String PROPERTY_SOURCE_LENGTH = "sourceLength";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_SOURCE_POSITION = "sourcePosition";
	
	/**
	 * @module.api
	 */
	public static final String PROPERTY_SPOUSE = "spouse";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_START = "start";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_STATE = "state";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_STATUS = "status";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_STOP = "stop";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_STREET = "street";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_STREET1 = "street1";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_STYLE = "style";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_SUBTITLE = "subtitle";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_SUBTITLEID = "subtitleid";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_SUCCESS = "success";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_TAB_OPEN = "tabOpen";
	
	/**
	 * @module.api
	 */
	public static final String PROPERTY_TABS_BACKGROUND_COLOR = "tabsBackgroundColor";
	
	/**
	 * @module.api
	 */
	public static final String PROPERTY_TABS_BACKGROUND_SELECTED_COLOR = "tabsBackgroundSelectedColor";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_TAG = "tag";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_TEXT = "text";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_TEXTID = "textid";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_TEXT_ALIGN = "textAlign";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_TEXT_PADDING_LEFT = "textPaddingLeft";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_TEXT_PADDING_RIGHT = "textPaddingRight";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_TEXT_PADDING_TOP = "textPaddingTop";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_TEXT_PADDING_BOTTOM = "textPaddingBottom";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_TITLE_PADDING_LEFT = "titlePaddingLeft";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_TITLE_PADDING_RIGHT = "titlePaddingRight";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_TITLE_PADDING_TOP = "titlePaddingTop";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_TITLE_PADDING_BOTTOM = "titlePaddingBottom";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_TICKER_TEXT = "tickerText";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_TIME = "time";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_TIMESTAMP = "timestamp";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_TITLE = "title";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_TITLEID = "titleid";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_TITLE_ON = "titleOn";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_TITLE_OFF = "titleOff";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_TITLE_PROMPT = "titlePrompt";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_TITLE_PROMPTID = "titlepromptid";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_TO = "to";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_TOP = "top";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_TOUCH_ENABLED = "touchEnabled";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_TRANSFORM = "transform";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_TRUE_HEADING = "trueHeading";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_TYPE = "type";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_UPDATE_CURRENT_INTENT = "updateCurrentIntent";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_URI = "uri";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_URL = "url";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_USER_LOCATION = "userLocation";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_VALUE = "value";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_VERTICAL_ALIGN = "verticalAlign";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_VIBRATE_PATTERN = "vibratePattern";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_VISIBLE = "visible";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_VISIBLE_ITEMS = "visibleItems";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_VIEW = "view";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_VIEWS = "views";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_VOLUME = "volume";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_WHEN = "when";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_WIDTH = "width";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_WINDOW = "window";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_WINDOW_PIXEL_FORMAT = "windowPixelFormat";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_WINDOW_SOFT_INPUT_MODE = "windowSoftInputMode";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_WORD_WRAP = "wordWrap";
	
	/**
	 * @module.api
	 */
	public static final String PROPERTY_WORK = "work";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_HORIZONTAL_WRAP = "horizontalWrap";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_X = "x";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_Y = "y";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_Z = "z";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_ZINDEX = "zIndex";

	/**
	 * @module.api
	 */
	public static final String PROPERTY_ZOOM_ENABLED = "zoomEnabled";
	public static final String SIZE_AUTO = "auto";
	public static final String URL_APP_PREFIX = "app://";
	public static final String URL_APP_SCHEME = "app";
	public static final String URL_APP_JS = "app://app.js";
	public static final String URL_ANDROID_ASSET_RESOURCES = "file:///android_asset/Resources/";
}

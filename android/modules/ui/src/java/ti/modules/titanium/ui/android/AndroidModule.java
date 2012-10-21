/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.android;

import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.view.TiUIView;
import org.appcelerator.titanium.util.TiRHelper;

import ti.modules.titanium.ui.UIModule;
import ti.modules.titanium.ui.widget.TiUIProgressIndicator;
import ti.modules.titanium.ui.widget.webview.TiUIWebView;
import android.app.Activity;
import android.content.Intent;
import android.graphics.PixelFormat;
import android.text.util.Linkify;
import android.view.WindowManager;
import android.preference.PreferenceManager;
import android.content.Context;

@Kroll.module(parentModule=UIModule.class)
@Kroll.dynamicApis(properties = {
	"currentActivity"
})
public class AndroidModule extends KrollModule
{
	private static final String TAG = "UIAndroidModule";
	
	@Kroll.constant public static final int PIXEL_FORMAT_A_8 = PixelFormat.A_8;
	@Kroll.constant public static final int PIXEL_FORMAT_LA_88 = PixelFormat.LA_88;
	@Kroll.constant public static final int PIXEL_FORMAT_L_8 = PixelFormat.L_8;
	@Kroll.constant public static final int PIXEL_FORMAT_OPAQUE = PixelFormat.OPAQUE;
	@Kroll.constant public static final int PIXEL_FORMAT_RGBA_4444 = PixelFormat.RGBA_4444;
	@Kroll.constant public static final int PIXEL_FORMAT_RGBA_5551 = PixelFormat.RGBA_5551;
	@Kroll.constant public static final int PIXEL_FORMAT_RGBA_8888 = PixelFormat.RGBA_8888;
	@Kroll.constant public static final int PIXEL_FORMAT_RGBX_8888 = PixelFormat.RGBX_8888;
	@Kroll.constant public static final int PIXEL_FORMAT_RGB_332 = PixelFormat.RGB_332;
	@Kroll.constant public static final int PIXEL_FORMAT_RGB_565 = PixelFormat.RGB_565;
	@Kroll.constant public static final int PIXEL_FORMAT_RGB_888 = PixelFormat.RGB_888;
	@Kroll.constant public static final int PIXEL_FORMAT_TRANSLUCENT = PixelFormat.TRANSLUCENT;
	@Kroll.constant public static final int PIXEL_FORMAT_TRANSPARENT = PixelFormat.TRANSPARENT;
	@Kroll.constant public static final int PIXEL_FORMAT_UNKNOWN = PixelFormat.UNKNOWN;
	
	@Kroll.constant public static final int SOFT_INPUT_ADJUST_PAN = WindowManager.LayoutParams.SOFT_INPUT_ADJUST_PAN;
	@Kroll.constant public static final int SOFT_INPUT_ADJUST_RESIZE = WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE;
	@Kroll.constant public static final int SOFT_INPUT_ADJUST_UNSPECIFIED = WindowManager.LayoutParams.SOFT_INPUT_ADJUST_UNSPECIFIED;
	
	@Kroll.constant public static final int SOFT_INPUT_STATE_ALWAYS_HIDDEN = WindowManager.LayoutParams.SOFT_INPUT_STATE_ALWAYS_HIDDEN;
	@Kroll.constant public static final int SOFT_INPUT_STATE_ALWAYS_VISIBLE = WindowManager.LayoutParams.SOFT_INPUT_STATE_ALWAYS_VISIBLE;
	@Kroll.constant public static final int SOFT_INPUT_STATE_HIDDEN = WindowManager.LayoutParams.SOFT_INPUT_STATE_HIDDEN;
	@Kroll.constant public static final int SOFT_INPUT_STATE_UNSPECIFIED = WindowManager.LayoutParams.SOFT_INPUT_STATE_UNSPECIFIED;
	@Kroll.constant public static final int SOFT_INPUT_STATE_VISIBLE = WindowManager.LayoutParams.SOFT_INPUT_STATE_VISIBLE;
	
	@Kroll.constant public static final int SOFT_KEYBOARD_DEFAULT_ON_FOCUS = TiUIView.SOFT_KEYBOARD_DEFAULT_ON_FOCUS;
	@Kroll.constant public static final int SOFT_KEYBOARD_HIDE_ON_FOCUS = TiUIView.SOFT_KEYBOARD_HIDE_ON_FOCUS;
	@Kroll.constant public static final int SOFT_KEYBOARD_SHOW_ON_FOCUS = TiUIView.SOFT_KEYBOARD_SHOW_ON_FOCUS;
	
	@Kroll.constant public static final int LINKIFY_ALL = Linkify.ALL;
	@Kroll.constant public static final int LINKIFY_EMAIL_ADDRESSES = Linkify.EMAIL_ADDRESSES;
	@Kroll.constant public static final int LINKIFY_MAP_ADDRESSES = Linkify.MAP_ADDRESSES;
	@Kroll.constant public static final int LINKIFY_PHONE_NUMBERS = Linkify.PHONE_NUMBERS;
	@Kroll.constant public static final int LINKIFY_WEB_URLS = Linkify.WEB_URLS;
	
	@Kroll.constant public static final int SWITCH_STYLE_CHECKBOX     = 0;
	@Kroll.constant public static final int SWITCH_STYLE_TOGGLEBUTTON = 1;
	
	@Kroll.constant public static final int WEBVIEW_PLUGINS_OFF = TiUIWebView.PLUGIN_STATE_OFF;
	@Kroll.constant public static final int WEBVIEW_PLUGINS_ON = TiUIWebView.PLUGIN_STATE_ON;
	@Kroll.constant public static final int WEBVIEW_PLUGINS_ON_DEMAND = TiUIWebView.PLUGIN_STATE_ON_DEMAND;

	@Kroll.constant public static final int PROGRESS_INDICATOR_STATUS_BAR = TiUIProgressIndicator.STATUS_BAR;
	@Kroll.constant public static final int PROGRESS_INDICATOR_DIALOG = TiUIProgressIndicator.DIALOG;
	@Kroll.constant public static final int PROGRESS_INDICATOR_INDETERMINANT = TiUIProgressIndicator.INDETERMINANT;
	@Kroll.constant public static final int PROGRESS_INDICATOR_DETERMINANT = TiUIProgressIndicator.DETERMINANT;

	public AndroidModule()
	{
		super();
		loadDefaultPreferences(TiPreferencesActivity.DEFAULT_PREFS_RNAME);
	}

	public AndroidModule(TiContext tiContext) 
	{
		this();
	}
	private void loadDefaultPreferences(String prefsName)
	{
		Activity currentActivity = TiApplication.getAppCurrentActivity();
		try {
			int resid = TiRHelper.getResource("xml." + prefsName);
			PreferenceManager.setDefaultValues(currentActivity, TiApplication.APPLICATION_PREFERENCES_NAME, Context.MODE_PRIVATE, resid, false);
		} catch (TiRHelper.ResourceNotFoundException e) {
			Log.e(TAG, "xml." + prefsName + " preferences not found.");
			return ;
		}
	}

	// TODO - grab the activity off the invocation?
	@Kroll.method
	public void loadPreferences(@Kroll.argument(optional=true) String prefsName)
	{
		Activity currentActivity = TiApplication.getAppCurrentActivity();
		String prefsFileName = TiPreferencesActivity.DEFAULT_PREFS_RNAME;
		if (prefsName != null) {
			prefsFileName = prefsName;
		}
		loadDefaultPreferences(prefsFileName);
	}


	// TODO - grab the activity off the invocation?
	@Kroll.method
	public void openPreferences(@Kroll.argument(optional=true) String prefsName)
	{
		if (activity != null) {
			
			Intent i = new Intent(getActivity(), TiPreferencesActivity.class);
			if (prefsName != null) {
				i.putExtra("prefsName", prefsName);
			}
			getActivity().startActivity(i);
		} else {
			Log.w(TAG, "Unable to open preferences. Activity is null", Log.DEBUG_MODE);
		}
	}

	// TODO Need to be revisited to hide keyboard based on specific view
	@Kroll.method
	public void hideSoftKeyboard()
	{
		Activity currentActivity = TiApplication.getAppCurrentActivity();
		if (currentActivity != null) {
			TiUIHelper.showSoftKeyboard(currentActivity.getWindow().getDecorView(), false);
		} else if (activity != null) {
			TiUIHelper.showSoftKeyboard(getActivity().getWindow().getDecorView(), false);
		} else {
			Log.w(TAG, "Unable to hide soft keyboard. Activity is null", Log.DEBUG_MODE);
		}
	}
}

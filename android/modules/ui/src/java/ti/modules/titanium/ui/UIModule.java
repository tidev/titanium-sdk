/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiBaseActivity;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.proxy.TiWindowProxy;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiOrientationHelper;
import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.view.TiDrawableReference;

import android.app.Activity;
import android.content.res.Resources;
import android.graphics.drawable.ColorDrawable;
import android.graphics.drawable.Drawable;
import android.view.Window;
import android.widget.Toast;

@Kroll.module
@Kroll.dynamicApis(properties = {
	"currentWindow"
})
public class UIModule extends KrollModule
{
	private static final String LCAT = "TiUIModule";

	@Kroll.constant public static final int RETURNKEY_GO = 0;
	@Kroll.constant public static final int RETURNKEY_GOOGLE = 1;
	@Kroll.constant public static final int RETURNKEY_JOIN = 2;
	@Kroll.constant public static final int RETURNKEY_NEXT = 3;
	@Kroll.constant public static final int RETURNKEY_ROUTE = 4;
	@Kroll.constant public static final int RETURNKEY_SEARCH = 5;
	@Kroll.constant public static final int RETURNKEY_YAHOO = 6;
	@Kroll.constant public static final int RETURNKEY_DONE = 7;
	@Kroll.constant public static final int RETURNKEY_EMERGENCY_CALL = 8;
	@Kroll.constant public static final int RETURNKEY_DEFAULT = 9;
	@Kroll.constant public static final int RETURNKEY_SEND = 10;

	@Kroll.constant public static final int KEYBOARD_APPEARANCE_DEFAULT = -1; // Not supported
	@Kroll.constant public static final int KEYBOARD_APPEARANCE_ALERT = -1; // Not supported

	@Kroll.constant public static final int KEYBOARD_ASCII = 0;
	@Kroll.constant public static final int KEYBOARD_NUMBERS_PUNCTUATION = 1;
	@Kroll.constant public static final int KEYBOARD_URL = 2;
	@Kroll.constant public static final int KEYBOARD_NUMBER_PAD = 3;
	@Kroll.constant public static final int KEYBOARD_PHONE_PAD = 4;
	@Kroll.constant public static final int KEYBOARD_EMAIL = 5;
	@Kroll.constant public static final int KEYBOARD_NAMEPHONE_PAD = 6;
	@Kroll.constant public static final int KEYBOARD_DEFAULT = 7;
	@Kroll.constant public static final int KEYBOARD_DECIMAL_PAD = 8;

	@Kroll.constant public static final int INPUT_BORDERSTYLE_NONE = 0;
	@Kroll.constant public static final int INPUT_BORDERSTYLE_ROUNDED = 1;
	@Kroll.constant public static final int INPUT_BORDERSTYLE_BEZEL = 2;
	@Kroll.constant public static final int INPUT_BORDERSTYLE_LINE = 3;
	@Kroll.constant public static final int INPUT_BUTTONMODE_ONFOCUS = 0;
	@Kroll.constant public static final int INPUT_BUTTONMODE_ALWAYS = 1;
	@Kroll.constant public static final int INPUT_BUTTONMODE_NEVER = 2;

	@Kroll.constant public static final int MAP_VIEW_STANDARD = 1;
	@Kroll.constant public static final int MAP_VIEW_SATELLITE = 2;
	@Kroll.constant public static final int MAP_VIEW_HYBRID = 3;

	@Kroll.constant public static final int TABLEVIEW_POSITION_ANY = 0;
	@Kroll.constant public static final int TABLEVIEW_POSITION_TOP = 1;
	@Kroll.constant public static final int TABLEVIEW_POSITION_MIDDLE = 2;
	@Kroll.constant public static final int TABLEVIEW_POSITION_BOTTOM = 3;
	
	@Kroll.constant public static final String TEXT_ALIGNMENT_LEFT = "left";
	@Kroll.constant public static final String TEXT_ALIGNMENT_CENTER = "center";
	@Kroll.constant public static final String TEXT_ALIGNMENT_RIGHT = "right";
	@Kroll.constant public static final String TEXT_VERTICAL_ALIGNMENT_BOTTOM = "bottom";
	@Kroll.constant public static final String TEXT_VERTICAL_ALIGNMENT_CENTER = "middle";
	@Kroll.constant public static final String TEXT_VERTICAL_ALIGNMENT_TOP = "top";
	
	@Kroll.constant public static final int PORTRAIT = TiOrientationHelper.ORIENTATION_PORTRAIT;
	@Kroll.constant public static final int UPSIDE_PORTRAIT = TiOrientationHelper.ORIENTATION_PORTRAIT_REVERSE;
	@Kroll.constant public static final int LANDSCAPE_LEFT = TiOrientationHelper.ORIENTATION_LANDSCAPE;
	@Kroll.constant public static final int LANDSCAPE_RIGHT = TiOrientationHelper.ORIENTATION_LANDSCAPE_REVERSE;
	@Kroll.constant public static final int FACE_UP = TiUIHelper.FACE_UP;
	@Kroll.constant public static final int FACE_DOWN = TiUIHelper.FACE_DOWN;
	@Kroll.constant public static final int UNKNOWN = TiOrientationHelper.ORIENTATION_UNKNOWN;
	
	@Kroll.constant public static final int PICKER_TYPE_PLAIN = -1;
	@Kroll.constant public static final int PICKER_TYPE_TIME = 0;
	@Kroll.constant public static final int PICKER_TYPE_DATE = 1;
	@Kroll.constant public static final int PICKER_TYPE_DATE_AND_TIME = 2;
	@Kroll.constant public static final int PICKER_TYPE_COUNT_DOWN_TIMER = 3;
	
	@Kroll.constant public static final int NOTIFICATION_DURATION_LONG = Toast.LENGTH_LONG;
	@Kroll.constant public static final int NOTIFICATION_DURATION_SHORT = Toast.LENGTH_SHORT;
	
	@Kroll.constant public static final int TEXT_AUTOCAPITALIZATION_NONE = 0;
	@Kroll.constant public static final int TEXT_AUTOCAPITALIZATION_SENTENCES = 1;
	@Kroll.constant public static final int TEXT_AUTOCAPITALIZATION_WORDS = 2;
	@Kroll.constant public static final int TEXT_AUTOCAPITALIZATION_ALL = 3;

	public UIModule()
	{
		super();
	}

	public UIModule(TiContext tiContext)
	{
		this();
	}

	@Kroll.setProperty(runOnUiThread=true) @Kroll.method(runOnUiThread=true)
	public void setBackgroundColor(String color)
	{
		Window w = TiApplication.getInstance().getRootActivity().getWindow();
		if (w != null) {
			w.setBackgroundDrawable(new ColorDrawable(TiConvert.toColor((String)color)));
		}
	}

	@Kroll.setProperty(runOnUiThread=true) @Kroll.method(runOnUiThread=true)
	public void setBackgroundImage(Object image)
	{
		Window w = TiApplication.getInstance().getRootActivity().getWindow();
		if (w != null) {
			if (image instanceof Number) {
				try {
					w.setBackgroundDrawableResource(((Number)image).intValue());
				} catch (Resources.NotFoundException e) {
					Log.w(LCAT , "Unable to set background drawable for root window.  An integer id was provided but no such drawable resource exists.");
				}
				return;
			}
			// TODO - current activity should work just fine in this instance - verify?
			TiDrawableReference drawableRef = TiDrawableReference.fromObject(TiApplication.getInstance().getCurrentActivity(), image);
			Drawable d = drawableRef.getDrawable();
			if (d != null) {
				w.setBackgroundDrawable(d);
			}
		}
	}

	@Kroll.setProperty(runOnUiThread=true) @Kroll.method(runOnUiThread=true)
	public void setOrientation(int tiOrientationMode)
	{
		Activity activity = TiApplication.getInstance().getCurrentActivity();
		if (activity instanceof TiBaseActivity)
		{
			int[] orientationModes;

			if (tiOrientationMode == -1)
			{
				orientationModes = new int[] {};
			}
			else
			{
				orientationModes = new int[] {tiOrientationMode};
			}

			// this should only be entered if a LW window is created on top of the root activity
			TiBaseActivity tiBaseActivity = (TiBaseActivity)activity;
			TiWindowProxy windowProxy = tiBaseActivity.getWindowProxy();

			if (windowProxy == null)
			{
				if (tiBaseActivity.lwWindow != null)
				{
					tiBaseActivity.lwWindow.setOrientationModes(orientationModes);
				}
				else
				{
					Log.e(LCAT, "no window has been associated with activity, unable to set orientation");
				}
			}
			else
			{
				windowProxy.setOrientationModes(orientationModes);
			}
		}
	}
}

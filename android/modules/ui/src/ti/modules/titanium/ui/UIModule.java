/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import org.appcelerator.kroll.KrollInvocation;
import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.util.TiConvert;

import android.app.Activity;
import android.content.pm.ActivityInfo;
import android.graphics.drawable.ColorDrawable;
import android.view.Window;
import android.widget.Toast;

@Kroll.module
public class UIModule extends KrollModule
{
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
	
	@Kroll.constant public static final int PORTRAIT = 1;
	@Kroll.constant public static final int UPSIDE_PORTRAIT = 2;
	@Kroll.constant public static final int LANDSCAPE_LEFT = 3;
	@Kroll.constant public static final int LANDSCAPE_RIGHT = 4;
	@Kroll.constant public static final int FACE_UP = 5;
	@Kroll.constant public static final int FACE_DOWN = 6;
	@Kroll.constant public static final int UNKNOWN = 7;
	
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
	
	public UIModule(TiContext tiContext)
	{
		super(tiContext);
	}
	
	@Kroll.setProperty(runOnUiThread=true) @Kroll.method(runOnUiThread=true)
	public void setBackgroundColor(String color)
	{
		Window w = getTiContext().getRootActivity().getWindow();
		if (w != null) {
			w.setBackgroundDrawable(new ColorDrawable(TiConvert.toColor((String)color)));
		}
	}
	
	@Kroll.setProperty(runOnUiThread=true) @Kroll.method(runOnUiThread=true)
	public void setOrientation(KrollInvocation invocation, int orientation)
	{
		int requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED;
		switch (orientation) {
			case LANDSCAPE_LEFT :
			case LANDSCAPE_RIGHT :
				requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE;
				break;
			case PORTRAIT :
			case UPSIDE_PORTRAIT :
				requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_PORTRAIT;
				break;
		}
		
		Activity activity = invocation.getTiContext().getActivity();
		if (activity != null) {
			activity.setRequestedOrientation(requestedOrientation);
		}
		// null out the value so a call to set will result in the orientation being set.
		setProperty("orientation", null);
		//internalSetDynamicValue("orientation", null, false);
	}

}

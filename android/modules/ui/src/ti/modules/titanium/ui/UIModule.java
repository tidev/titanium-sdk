/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.TiModule;
import org.appcelerator.titanium.TiProxy;
import org.appcelerator.titanium.util.TiConvert;

import android.app.Activity;
import android.content.pm.ActivityInfo;
import android.graphics.drawable.ColorDrawable;
import android.text.method.TextKeyListener.Capitalize;
import android.view.Window;
import android.widget.Toast;

public class UIModule extends TiModule
{
	private static TiDict constants;

	public static final int PORTRAIT = 1;
	public static final int UPSIDE_PORTRAIT = 2;
	public static final int LANDSCAPE_LEFT = 3;
	public static final int LANDSCAPE_RIGHT = 4;
	public static final int FACE_UP = 5;
	public static final int FACE_DOWN = 6;
	public static final int UNKNOWN = 7;
	
	public static final int PICKER_TYPE_PLAIN = -1;
	public static final int PICKER_TYPE_TIME = 0;
	public static final int PICKER_TYPE_DATE = 1;
	public static final int PICKER_TYPE_DATE_AND_TIME = 2;
	public static final int PICKER_TYPE_COUNT_DOWN_TIMER = 3;

	public UIModule(TiContext tiContext)
	{
		super(tiContext);
	}

	@Override
	public TiDict getConstants()
	{
		if (constants == null)
		{
			constants = new TiDict();

			constants.put("RETURNKEY_GO", 0);
			constants.put("RETURNKEY_GOOGLE", 1);
			constants.put("RETURNKEY_JOIN", 2);
			constants.put("RETURNKEY_NEXT", 3);
			constants.put("RETURNKEY_ROUTE", 4);
			constants.put("RETURNKEY_SEARCH", 5);
			constants.put("RETURNKEY_YAHOO", 6);
			constants.put("RETURNKEY_DONE", 7);
			constants.put("RETURNKEY_EMERGENCY_CALL", 8);
			constants.put("RETURNKEY_DEFAULT", 9);
			constants.put("RETURNKEY_SEND", 10);

			constants.put("KEYBOARD_APPEARANCE_DEFAULT", -1); // Not supported
			constants.put("KEYBOARD_APPEARANCE_ALERT", -1); // Not supported

			constants.put("KEYBOARD_ASCII", 0);
			constants.put("KEYBOARD_NUMBERS_PUNCTUATION", 1);
			constants.put("KEYBOARD_URL", 2);
			constants.put("KEYBOARD_NUMBER_PAD", 3);
			constants.put("KEYBOARD_PHONE_PAD", 4);
			constants.put("KEYBOARD_EMAIL", 5);
			constants.put("KEYBOARD_NAMEPHONE_PAD", 6);
			constants.put("KEYBOARD_DEFAULT", 7);

			constants.put("INPUT_BORDERSTYLE_NONE", 0);
			constants.put("INPUT_BORDERSTYLE_ROUNDED", 1);
			constants.put("INPUT_BORDERSTYLE_BEZEL", 2);
			constants.put("INPUT_BORDERSTYLE_LINE", 3);
			constants.put("INPUT_BUTTONMODE_ONFOCUS", 0);
			constants.put("INPUT_BUTTONMODE_ALWAYS", 1);
			constants.put("INPUT_BUTTONMODE_NEVER", 2);

			constants.put("MAP_VIEW_STANDARD", 1);
			constants.put("MAP_VIEW_SATELLITE", 2);
			constants.put("MAP_VIEW_HYBRID", 3);

			constants.put("TABLEVIEW_POSITION_ANY", 0);
			constants.put("TABLEVIEW_POSITION_TOP", 1);
			constants.put("TABLEVIEW_POSITION_MIDDLE", 2);
			constants.put("TABLEVIEW_POSITION_BOTTOM", 3);

			constants.put("TEXT_ALIGNMENT_LEFT", "left");
			constants.put("TEXT_ALIGNMENT_CENTER", "center");
			constants.put("TEXT_ALIGNMENT_RIGHT", "right");

			constants.put("PORTRAIT", PORTRAIT);
			constants.put("UPSIDE_PORTRAIT", UPSIDE_PORTRAIT);
			constants.put("LANDSCAPE_LEFT", LANDSCAPE_LEFT);
			constants.put("LANDSCAPE_RIGHT", LANDSCAPE_RIGHT);
			constants.put("FACE_UP", FACE_UP);
			constants.put("FACE_DOWN", FACE_DOWN);
			constants.put("UNKNOWN", UNKNOWN);
			
			constants.put("NOTIFICATION_DURATION_LONG", Toast.LENGTH_LONG);
			constants.put("NOTIFICATION_DURATION_SHORT", Toast.LENGTH_SHORT);
			
			constants.put("TEXT_AUTOCAPITALIZATION_NONE", 0);
			constants.put("TEXT_AUTOCAPITALIZATION_SENTENCES", 1);
			constants.put("TEXT_AUTOCAPITALIZATION_WORDS", 2);
			constants.put("TEXT_AUTOCAPITALIZATION_ALL", 3);
			
			constants.put("PICKER_TYPE_PLAIN", PICKER_TYPE_PLAIN);
			constants.put("PICKER_TYPE_TIME", PICKER_TYPE_TIME);
			constants.put("PICKER_TYPE_DATE", PICKER_TYPE_DATE);
			constants.put("PICKER_TYPE_DATE_AND_TIME", PICKER_TYPE_DATE_AND_TIME);
			constants.put("PICKER_TYPE_COUNT_DOWN_TIMER", PICKER_TYPE_COUNT_DOWN_TIMER);

			
		}

		return constants;
	}

	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue, TiProxy proxy)
	{
		if ("backgroundColor".equals(key)) {
			Window w = getTiContext().getRootActivity().getWindow();
			if (w != null) {
				w.setBackgroundDrawable(new ColorDrawable(TiConvert.toColor((String)newValue)));
			}
		} else if ("orientation".equals(key)) {
			int requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED;

			if (newValue != null) {
				switch (TiConvert.toInt(newValue)) {
					case LANDSCAPE_LEFT :
					case LANDSCAPE_RIGHT :
						requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE;
						break;
					case PORTRAIT :
					case UPSIDE_PORTRAIT :
						requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_PORTRAIT;
						break;
				}
			}
			Activity activity = proxy.getTiContext().getTiApp().getCurrentActivity();
			if (activity != null) {
				activity.setRequestedOrientation(requestedOrientation);
			}
			// null out the value so a call to set will result in the orientation being set.
			internalSetDynamicValue("orientation", null, false);
		} else {
			super.propertyChanged(key, oldValue, newValue, proxy);
		}
	}

}

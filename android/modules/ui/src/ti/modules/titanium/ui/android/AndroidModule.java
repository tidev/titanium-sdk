/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.android;

import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.UIModule;
import android.app.Activity;
import android.content.Intent;
import android.text.util.Linkify;
import android.view.WindowManager;

@Kroll.module(parentModule=UIModule.class)
public class AndroidModule extends KrollModule
{
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
	
	public AndroidModule(TiContext tiContext) 
	{
		super(tiContext);
	}
	
	@Kroll.method
	public void openPreferences()
	{
		Activity act = getTiContext().getActivity();
		if (act == null) return;
		
		act.startActivity(new Intent(act, TiPreferencesActivity.class));
	}
}

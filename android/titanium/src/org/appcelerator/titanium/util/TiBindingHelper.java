package org.appcelerator.titanium.util;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.kroll.KrollBridge;
import org.appcelerator.titanium.proxy.ActivityProxy;
import org.appcelerator.titanium.proxy.IntentProxy;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.proxy.TiWindowProxy;

import android.app.Activity;

public class TiBindingHelper {

	public static void bindCurrentActivity(TiContext context, Activity currentActivity) {
		bindCurrentActivity(context, new ActivityProxy(context, currentActivity));
	}
	
	public static void bindCurrentActivity(TiContext context, ActivityProxy currentActivity) {
		KrollBridge bridge = context.getKrollBridge();
		bridge.bindContextSpecific("Android", "currentActivity", currentActivity);
		
		IntentProxy currentIntent = currentActivity.getIntent();
		if (currentIntent != null) {
			bridge.bindContextSpecific("Android", "currentIntent", currentIntent);
		}
	}
	
	public static void bindCurrentWindow(TiContext context, TiViewProxy currentWindow) {
		KrollBridge bridge = context.getKrollBridge();
		bridge.bindContextSpecific("UI", "currentWindow", currentWindow);
		if (!(currentWindow instanceof TiWindowProxy)) return;
		
		TiWindowProxy window = (TiWindowProxy)currentWindow;
		TiViewProxy currentTab = window.getTabProxy();
		if (currentTab != null) {
			bridge.bindContextSpecific("UI", "currentTabGroup", window.getTabGroupProxy());
			bridge.bindContextSpecific("UI", "currentTab", currentTab);
		}
	}
	
	public static void bindCurrentWindowAndActivity(TiContext context,
		TiViewProxy currentWindow, Activity currentActivity)
	{
		bindCurrentWindow(context, currentWindow);
		bindCurrentActivity(context, currentActivity);
	}
}

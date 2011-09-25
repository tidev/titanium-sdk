/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.util;

import org.appcelerator.titanium.proxy.ActivityProxy;
import org.appcelerator.titanium.proxy.ServiceProxy;
import org.appcelerator.titanium.proxy.TiViewProxy;

public class TiBindingHelper {

	public static void bindCurrentActivity(ActivityProxy currentActivityProxy) {
		//context.getKrollBridge().bindContextSpecific("Android", "currentActivity", currentActivityProxy);
	}
	
	public static void bindCurrentService(ServiceProxy currentService) {
		//context.getKrollBridge().bindContextSpecific("Android", "currentService", currentService);
	}
	
	public static void bindCurrentWindow(TiViewProxy currentWindow) {
		/*KrollBridge bridge = context.getKrollBridge();
		bridge.bindContextSpecific("UI", "currentWindow", currentWindow);
		if (!(currentWindow instanceof TiWindowProxy)) return;
		
		TiWindowProxy window = (TiWindowProxy)currentWindow;
		TiViewProxy currentTab = window.getTabProxy();
		if (currentTab != null) {
			bridge.bindContextSpecific("UI", "currentTabGroup", window.getTabGroupProxy());
			bridge.bindContextSpecific("UI", "currentTab", currentTab);
		}*/
	}
	
	public static void bindCurrentWindowAndActivity(TiViewProxy currentWindow, ActivityProxy currentActivityProxy)
	{
		//bindCurrentWindow(context, currentWindow);
		//bindCurrentActivity(context, currentActivityProxy);
	}
}

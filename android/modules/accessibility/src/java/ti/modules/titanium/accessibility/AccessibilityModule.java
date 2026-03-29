/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.accessibility;

import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.view.TiUIView;

import android.view.accessibility.AccessibilityEvent;
import android.view.accessibility.AccessibilityManager;
import android.view.accessibility.AccessibilityNodeInfo;
import androidx.core.view.accessibility.AccessibilityEventCompat;

@Kroll.module
public class AccessibilityModule extends KrollModule
{
	private static final String TAG = "AccessibilityModule";

	@Kroll.method
	public void announce(String message)
	{
		AccessibilityManager accessibilityManager = TiApplication.getInstance().getAccessibilityManager();
		if (!accessibilityManager.isEnabled()) {
			Log.w(TAG, "Accessibility announcement ignored. Accessibility services are not enabled on this device.");
			return;
		}
		if (message == null || message.isEmpty()) {
			Log.w(TAG, "Accessibility announcement ignored. No announcement text was provided.");
			return;
		}

		AccessibilityEvent event = AccessibilityEvent.obtain(AccessibilityEventCompat.TYPE_ANNOUNCEMENT);
		event.setEnabled(true);
		event.getText().clear();
		event.getText().add(message);
		accessibilityManager.sendAccessibilityEvent(event);
	}

	@Kroll.method
	public void focus(Object viewProxy)
	{
		if (!(viewProxy instanceof TiViewProxy)) {
			Log.w(TAG, "Ti.Accessibility.focus: argument must be a Ti.UI view proxy.");
			return;
		}
		
		TiViewProxy proxy = (TiViewProxy) viewProxy;
		TiUIView uiView = proxy.peekView();
		if (uiView == null) {
			Log.w(TAG, "Ti.Accessibility.focus: view is not yet realized, ignoring.");
			return;
		}

		final android.view.View nativeView = uiView.getNativeView();
		if (nativeView != null) {
			nativeView.post(new Runnable() {
				@Override
				public void run()
				{
					nativeView.performAccessibilityAction(AccessibilityNodeInfo.ACTION_ACCESSIBILITY_FOCUS, null);
				}
			});
		}
	}

	@Override
	public String getApiName()
	{
		return "Ti.Accessibility";
	}
}

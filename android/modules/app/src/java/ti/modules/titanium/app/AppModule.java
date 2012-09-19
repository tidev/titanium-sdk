/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.app;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.ITiAppInfo;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiPlatformHelper;

import android.os.Build;
import android.provider.Settings;
import android.support.v4.view.accessibility.AccessibilityEventCompat;
import android.support.v4.view.accessibility.AccessibilityManagerCompat;
import android.support.v4.view.accessibility.AccessibilityManagerCompat.AccessibilityStateChangeListenerCompat;
import android.view.accessibility.AccessibilityEvent;
import android.view.accessibility.AccessibilityManager;

@Kroll.module
public class AppModule extends KrollModule
{
	private static final String TAG = "AppModule";

	@Kroll.constant public static final String EVENT_ACCESSIBILITY_ANNOUNCEMENT = "accessibilityannouncement";
	@Kroll.constant public static final String EVENT_ACCESSIBILITY_CHANGED = "accessibilitychanged";

	private ITiAppInfo appInfo;
	private AccessibilityStateChangeListenerCompat accessibilityStateChangeListener = null;

	public AppModule()
	{
		super("App");

		TiApplication.getInstance().addAppEventProxy(this);
		appInfo = TiApplication.getInstance().getAppInfo();
	}

	public AppModule(TiContext tiContext)
	{
		this();
	}

	public void onDestroy() {
		TiApplication.getInstance().removeAppEventProxy(this);
	}

	@Kroll.getProperty @Kroll.method
	public String getId() {
		return appInfo.getId();
	}

	@Kroll.method
	public String getID() {
		return getId();
	}

	@Kroll.getProperty @Kroll.method
	public String getName() {
		return appInfo.getName();
	}

	@Kroll.getProperty @Kroll.method
	public String getVersion() {
		return appInfo.getVersion();
	}

	@Kroll.getProperty @Kroll.method
	public String getPublisher() {
		return appInfo.getPublisher();
	}

	@Kroll.getProperty @Kroll.method
	public String getUrl() {
		return appInfo.getUrl();
	}

	@Kroll.method
	public String getURL() {
		return getUrl();
	}

	@Kroll.getProperty @Kroll.method
	public String getDescription() {
		return appInfo.getDescription();
	}

	@Kroll.getProperty @Kroll.method
	public String getCopyright() {
		return appInfo.getCopyright();
	}

	@Kroll.getProperty @Kroll.method
	public String getGuid() {
		return appInfo.getGUID();
	}

	@Kroll.method
	public String getGUID() {
		return getGuid();
	}
	
	@Kroll.getProperty @Kroll.method
	public String getDeployType() {
		return TiApplication.getInstance().getDeployType();
	}
	
	@Kroll.getProperty @Kroll.method
	public String getSessionId() {
		return TiPlatformHelper.getSessionId();
	}
	
	@Kroll.getProperty @Kroll.method
	public boolean getAnalytics() {
		return appInfo.isAnalyticsEnabled();
	}
	
	@Kroll.method
	public String appURLToPath(String url) {
		return resolveUrl(null, url);
	}

	@Kroll.method @Kroll.getProperty
	public boolean getAccessibilityEnabled()
	{
		AccessibilityManager manager = TiApplication.getInstance().getAccessibilityManager();
		boolean enabled = manager.isEnabled();

		if (!enabled && Build.VERSION.SDK_INT < TiC.API_LEVEL_HONEYCOMB) {
			// Prior to Honeycomb, AccessibilityManager.isEnabled() would sometimes
			// return false erroneously the because manager service would asynchronously set the
			// enabled property in the manager client. So when checking the value, it
			// might not have been set yet. In studying the changes they made for
			// Honeycomb, we can see that they do the following in order to determine
			// if accessibility really is enabled or not:
			enabled = Settings.Secure.getInt(TiApplication.getInstance().getContentResolver(),
				Settings.Secure.ACCESSIBILITY_ENABLED, 0) == 1;
		}

		return enabled;
	}

	@Kroll.method
	public void fireSystemEvent(String eventName, @Kroll.argument(optional = true) Object arg)
	{
		if (eventName.equals(EVENT_ACCESSIBILITY_ANNOUNCEMENT)) {

			if (!getAccessibilityEnabled()) {
				Log.w(TAG, "Accessibility announcement ignored. Accessibility services are not enabled on this device.");
				return;
			}

			if (arg == null) {
				Log.w(TAG, "Accessibility announcement ignored. No announcement text was provided.");
				return;
			}

			AccessibilityManager accessibilityManager = TiApplication.getInstance().getAccessibilityManager();
			AccessibilityEvent event = AccessibilityEvent.obtain(AccessibilityEventCompat.TYPE_ANNOUNCEMENT);
			event.setEnabled(true);
			event.getText().clear();
			event.getText().add(TiConvert.toString(arg));
			accessibilityManager.sendAccessibilityEvent(event);

		} else {
			Log.w(TAG, "Unknown system event: " + eventName);
		}
	}

	@Override
	public void onHasListenersChanged(String event, boolean hasListeners)
	{
		super.onHasListenersChanged(event, hasListeners);

		// If listening for "accessibilitychanged", we need to register
		// our own listener with the system.
		if (!hasListeners && accessibilityStateChangeListener != null) {
			AccessibilityManagerCompat.removeAccessibilityStateChangeListener(TiApplication.getInstance().getAccessibilityManager(), accessibilityStateChangeListener);
			accessibilityStateChangeListener = null;
		} else if (hasListeners && accessibilityStateChangeListener == null) {
			accessibilityStateChangeListener = new AccessibilityStateChangeListenerCompat() {

				@Override
				public void onAccessibilityStateChanged(boolean enabled)
				{
					KrollDict data = new KrollDict();
					data.put(TiC.PROPERTY_ENABLED, enabled);
					fireEvent(EVENT_ACCESSIBILITY_CHANGED, data);
				}
			};

			AccessibilityManagerCompat.addAccessibilityStateChangeListener(TiApplication.getInstance().getAccessibilityManager(), accessibilityStateChangeListener);
		}
	}

}

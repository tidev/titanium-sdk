/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2017 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.IntentProxy;
import org.appcelerator.titanium.util.TiUIHelper;

import android.content.Context;
import android.content.pm.ShortcutInfo;
import android.content.pm.ShortcutManager;
import android.graphics.drawable.Icon;
import android.os.Build;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Kroll.proxy(creatableInModule=UIModule.class)
public class ShortcutProxy extends KrollProxy
{
	private static final String TAG = "ShortcutProxy";

	private Context context = null;
	private static ShortcutManager shortcutManager = null;
	private static List<ShortcutInfo> shortcuts = new ArrayList<ShortcutInfo>();

	private ShortcutInfo shortcut;
	private ShortcutInfo.Builder shortcutBuilder;

	public ShortcutProxy()
	{
		super();

		context = TiApplication.getAppRootOrCurrentActivity();
		if (shortcutManager == null) {
			shortcutManager = (ShortcutManager) context.getSystemService(Context.SHORTCUT_SERVICE);
		}
	}

	public void handleCreationDict(KrollDict dict)
	{
		// only supported on Android 7.1 and above
		if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N_MR1) {
			return;
		}

		if (dict.containsKey(TiC.PROPERTY_ID)) {
			shortcutBuilder = new ShortcutInfo.Builder(context, dict.getString(TiC.PROPERTY_ID));
		} else {
			Log.e(TAG, "id is required to create a shortcut!");
			return;
		}
		if (dict.containsKey(TiC.PROPERTY_INTENT)) {
			Object intentObj = dict.get(TiC.PROPERTY_INTENT);
			if (intentObj instanceof IntentProxy) {
				IntentProxy intentProxy = (IntentProxy) dict.get(TiC.PROPERTY_INTENT);
				shortcutBuilder.setIntent(intentProxy.getIntent());
			} else {
				Log.w(TAG, "intent invalid, expecting Ti.Android.Intent!");
			}
		}
		if (dict.containsKey(TiC.PROPERTY_TITLE)) {
			shortcutBuilder.setShortLabel(dict.getString(TiC.PROPERTY_TITLE));
		}
		if (dict.containsKey(TiC.PROPERTY_TEXT)) {
			shortcutBuilder.setLongLabel(dict.getString(TiC.PROPERTY_TITLE));
		}
		if (dict.containsKey(TiC.PROPERTY_ICON)) {
			Object icon = dict.get(TiC.PROPERTY_ICON);
			if (icon instanceof Number) {
				int resId = ((Number)icon).intValue();
				shortcutBuilder.setIcon(Icon.createWithResource(context, resId));
			} else if (icon instanceof String) {
				String uri = resolveUrl(null, dict.getString(TiC.PROPERTY_ICON));
				shortcutBuilder.setIcon(Icon.createWithResource(context, TiUIHelper.getResourceId(uri)));
			} else {
				Log.w(TAG, "icon invalid, expecting resourceId (Number) or path (String)!");
			}
		}

		shortcut = shortcutBuilder.build();

		// remove any pre-existing shortcuts with the same id
		for (ShortcutInfo shortcut : shortcutManager.getDynamicShortcuts()) {
			if (shortcut.getId().equals(this.shortcut.getId())) {
				shortcutManager.removeDynamicShortcuts(Arrays.asList(shortcut.getId()));
				shortcuts.remove(shortcut);
				break;
			}
		}

		super.handleCreationDict(dict);
	}

	@Kroll.method
	public void show()
	{
		if (shortcut != null) {
			if (!shortcuts.contains(shortcut)) {
				shortcuts.add(shortcut);
				shortcutManager.setDynamicShortcuts(shortcuts);
			}
		}
	}

	@Kroll.method
	public void hide()
	{
		if (shortcut != null) {
			if (shortcuts.contains(shortcut)) {
				shortcuts.remove(shortcut);
				shortcutManager.setDynamicShortcuts(shortcuts);
			}
		}
	}

	@Kroll.getProperty
	public String getId()
	{
		if (shortcut != null) {
			return shortcut.getId();
		}
		return null;
	}

	@Kroll.getProperty
	public boolean getVisible()
	{
		if (shortcut != null) {
			return shortcuts.contains(shortcut);
		}
		return false;
	}

	@Override
	public void release()
	{
		if (shortcut != null) {
			shortcuts.remove(shortcut);
			shortcutManager.setDynamicShortcuts(shortcuts);
			shortcut = null;
		}
		super.release();
	}

	@Override
	public String getApiName()
	{
		return "Ti.UI.Shortcut";
	}
}

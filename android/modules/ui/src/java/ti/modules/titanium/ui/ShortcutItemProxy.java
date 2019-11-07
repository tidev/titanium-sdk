/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2017 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.util.TiUIHelper;

import android.annotation.SuppressLint;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ShortcutInfo;
import android.content.pm.ShortcutManager;
import android.graphics.drawable.Icon;
import android.os.Build;

@Kroll.proxy(creatableInModule = UIModule.class)
public class ShortcutItemProxy extends KrollProxy
{
	private static final String TAG = "ShortcutItemProxy";

	private Context context = null;
	private static ShortcutManager shortcutManager = null;
	private static List<ShortcutInfo> shortcuts = new ArrayList<ShortcutInfo>();

	private ShortcutInfo shortcut;
	private ShortcutInfo.Builder shortcutBuilder;

	public ShortcutItemProxy()
	{
		super();

		// only supported on Android 7.1 and above
		if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N_MR1) {
			return;
		}

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

		String id = null;
		if (dict.containsKey(TiC.PROPERTY_ID)) {
			id = dict.getString(TiC.PROPERTY_ID);
			shortcutBuilder = new ShortcutInfo.Builder(context, id);
		} else {
			Log.e(TAG, "id is required to create a shortcut!");
			return;
		}

		// create shortcut intent
		Intent intent = new Intent(TiApplication.getAppRootOrCurrentActivity().getIntent());
		intent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_NEW_TASK);
		intent.setAction(Intent.ACTION_VIEW);
		intent.putExtra("shortcut", id);
		shortcutBuilder.setIntent(intent);

		if (dict.containsKey(TiC.PROPERTY_TITLE)) {
			shortcutBuilder.setShortLabel(dict.getString(TiC.PROPERTY_TITLE));
		}
		if (dict.containsKey(TiC.PROPERTY_DESCRIPTION)) {
			shortcutBuilder.setLongLabel(dict.getString(TiC.PROPERTY_DESCRIPTION));
		}
		if (dict.containsKey(TiC.PROPERTY_ICON)) {
			Object icon = dict.get(TiC.PROPERTY_ICON);
			if (icon instanceof Number) {
				int resId = ((Number) icon).intValue();
				shortcutBuilder.setIcon(Icon.createWithResource(context, resId));
			} else if (icon instanceof String) {
				String uri = resolveUrl(null, dict.getString(TiC.PROPERTY_ICON));
				shortcutBuilder.setIcon(Icon.createWithResource(context, TiUIHelper.getResourceId(uri)));
			} else {
				Log.w(TAG, "icon invalid, expecting resourceId (Number) or path (String)!");
			}
		}

		shortcut = shortcutBuilder.build();

		// obtain and update any pre-existing shortcuts
		for (ShortcutInfo shortcut : new ArrayList<>(this.shortcuts)) {
			if (shortcut.getId().equals(this.shortcut.getId())) {
				this.shortcuts.remove(shortcut);
			}
		}
		this.shortcutManager.setDynamicShortcuts(shortcuts);
		for (ShortcutInfo shortcut : this.shortcutManager.getDynamicShortcuts()) {
			if (shortcut.getId().equals(this.shortcut.getId())) {
				if (shortcut.isEnabled()) {
					this.show();
				}
			} else {
				this.shortcuts.add(shortcut);
			}
		}

		super.handleCreationDict(dict);
	}

	@SuppressLint("NewApi")
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

	@SuppressLint("NewApi")
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

	@Kroll.method
	public void pin()
	{
		if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && shortcut != null) {
			if (shortcutManager.isRequestPinShortcutSupported()) {
				boolean shortcutExists = false;
				for (ShortcutInfo shortcut : shortcutManager.getPinnedShortcuts()) {
					if (shortcut.getId().equals(this.shortcut.getId())) {
						shortcutExists = true;
						break;
					}
				}
				if (!shortcutExists) {
					shortcutManager.requestPinShortcut(this.shortcut, null);
				}
			}
		}
	}

	// clang-format off
	@SuppressLint("NewApi")
	@Kroll.method
	@Kroll.getProperty
	public String getId()
	// clang-format on
	{
		if (shortcut != null) {
			return shortcut.getId();
		}
		return null;
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public boolean getVisible()
	// clang-format on
	{
		if (shortcut != null) {
			return shortcuts.contains(shortcut);
		}
		return false;
	}

	@SuppressLint("NewApi")
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
		return "Ti.UI.ShortcutItem";
	}
}

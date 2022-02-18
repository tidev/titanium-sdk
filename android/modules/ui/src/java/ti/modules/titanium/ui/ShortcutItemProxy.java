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
import org.appcelerator.titanium.TiBlob;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.io.TiFileFactory;

import android.annotation.SuppressLint;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ShortcutInfo;
import android.content.pm.ShortcutManager;
import android.graphics.Bitmap;
import android.graphics.drawable.Icon;
import android.os.Build;

import java.util.ArrayList;
import java.util.List;

@Kroll.proxy(creatableInModule = UIModule.class)
public class ShortcutItemProxy extends KrollProxy
{
	private static final String TAG = "ShortcutItemProxy";

	private Context context = null;
	private static ShortcutManager shortcutManager = null;
	private static final List<ShortcutInfo> shortcuts = new ArrayList<>();

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
			throw new Error("id is required to create a shortcut!");
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
			try {
				if (icon instanceof Number) {
					int resId = ((Number) icon).intValue();
					shortcutBuilder.setIcon(Icon.createWithResource(context, resId));

				} else if (icon instanceof String) {
					final String uri = resolveUrl(null, (String) icon);
					final TiBlob blob = TiBlob.blobFromFile(TiFileFactory.createTitaniumFile(uri, false));
					final Bitmap bitmap = blob.getImage();

					if (bitmap != null) {
						shortcutBuilder.setIcon(Icon.createWithBitmap(bitmap));
					}
				} else {
					Log.w(TAG, "icon invalid, expecting resourceId (Number) or path (String)!");
				}
			} catch (Exception e) {
				Log.w(TAG, e.getMessage());
			}
		}

		shortcut = shortcutBuilder.build();

		// obtain and update any pre-existing shortcuts
		for (ShortcutInfo shortcut : new ArrayList<>(ShortcutItemProxy.shortcuts)) {
			if (shortcut.getId().equals(this.shortcut.getId())) {
				ShortcutItemProxy.shortcuts.remove(shortcut);
			}
		}
		ShortcutItemProxy.shortcuts.add(shortcut);

		super.handleCreationDict(dict);
	}

	@SuppressLint("NewApi")
	@Deprecated
	@Kroll.method
	public void show()
	{
		if (shortcut != null) {
			if (!shortcuts.contains(shortcut)) {
				shortcuts.add(shortcut);
				try {
					shortcutManager.addDynamicShortcuts(shortcuts);
				} catch (Exception e) {
					Log.w(TAG, e.getMessage());
				}
			}
		}
	}

	@SuppressLint("NewApi")
	@Deprecated
	@Kroll.method
	public void hide()
	{
		if (shortcut != null) {
			if (shortcuts.contains(shortcut)) {
				final List<String> shortcutIds = new ArrayList<>();

				shortcutIds.add(shortcut.getId());
				shortcuts.remove(shortcut);

				try {
					shortcutManager.removeDynamicShortcuts(shortcutIds);
				} catch (Exception e) {
					Log.w(TAG, e.getMessage());
				}
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

	public String getId()
	{
		return properties.getString(TiC.PROPERTY_ID);
	}

	public String getTitle()
	{
		return properties.getString(TiC.PROPERTY_TITLE);
	}

	public String getDescription()
	{
		return properties.getString(TiC.PROPERTY_DESCRIPTION);
	}

	public Object getIcon()
	{
		return properties.get(TiC.PROPERTY_ICON);
	}

	public KrollDict getData()
	{
		return properties.getKrollDict(TiC.PROPERTY_DATA);
	}

	@Deprecated
	@Kroll.getProperty
	public boolean getVisible()
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

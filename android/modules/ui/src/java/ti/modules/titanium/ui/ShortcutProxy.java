/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2020 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import android.content.Context;
import android.content.Intent;
import android.content.pm.ShortcutInfo;
import android.content.pm.ShortcutManager;
import android.graphics.drawable.Icon;
import android.os.Build;
import android.os.PersistableBundle;

import androidx.annotation.RequiresApi;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.util.TiUIHelper;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

@Kroll.proxy(
	// Rename to not override `ShortcutModule` definition.
	name = "_Shortcut"
)
public class ShortcutProxy extends KrollProxy
{
	private static final String TAG = "ShortcutProxy";

	// Only supported on Android 7.1 and above.
	private static final boolean shortcutCapability = Build.VERSION.SDK_INT >= Build.VERSION_CODES.N_MR1;

	private static ShortcutManager shortcutManager = null;

	public ShortcutProxy()
	{
		super();

		if (!shortcutCapability) {
			return;
		}

		// Obtain `ShortcutManager` instance.
		if (shortcutManager == null) {
			final Context context = TiApplication.getInstance();
			shortcutManager = (ShortcutManager) context.getSystemService(Context.SHORTCUT_SERVICE);
		}
	}

	/**
	 * Create a `ShortcutItemProxy` array from a `ShortcutInfo` list.
	 * @param shortcuts List of `ShortcutInfo` objects.
	 * @return Array of `ShortcutItemProxy` objects.
	 */
	@RequiresApi(api = Build.VERSION_CODES.N_MR1)
	private ShortcutItemProxy[] toShortcutItems(List<ShortcutInfo> shortcuts)
	{
		final List<ShortcutItemProxy> items = new ArrayList<>();

		for (ShortcutInfo shortcut : shortcuts) {
			final ShortcutItemProxy shortcutItemProxy = new ShortcutItemProxy();
			final KrollDict creationDict = new KrollDict();

			// Translate into ShortcutItemProxy.
			creationDict.put(TiC.PROPERTY_ID, shortcut.getId());
			creationDict.put(TiC.PROPERTY_TITLE, shortcut.getShortLabel());
			creationDict.put(TiC.PROPERTY_DESCRIPTION, shortcut.getLongLabel());

			// Obtain additional stored data.
			if (shortcut.getExtras() != null) {
				final PersistableBundle bundle = shortcut.getExtras();

				if (bundle.containsKey(TiC.PROPERTY_ICON)) {
					creationDict.put(TiC.PROPERTY_ICON, bundle.get(TiC.PROPERTY_ICON));
				}
				if (bundle.containsKey(TiC.PROPERTY_DATA)) {
					try {
						final KrollDict data = new KrollDict(new JSONObject(bundle.getString(TiC.PROPERTY_DATA)));
						creationDict.put(TiC.PROPERTY_DATA, data);
					} catch (JSONException e) {
						Log.w(TAG, "Could not parse bundle data property.");
					}
				}
			}

			// Initialize ShortcutItemProxy.
			shortcutItemProxy.handleCreationDict(creationDict);
			items.add(shortcutItemProxy);
		}

		return items.toArray(new ShortcutItemProxy[items.size()]);
	}

	/**
	 * Obtain array of current active shortcuts.
	 * @return Array of `ShortcutItemProxy` objects.
	 */
	@Kroll.getProperty
	public ShortcutItemProxy[] items()
	{
		if (!shortcutCapability || shortcutManager == null) {
			return null;
		}

		final List<ShortcutInfo> shortcuts = shortcutManager.getDynamicShortcuts();
		return toShortcutItems(shortcuts);
	}

	/**
	 * Obtain array of current active static shortcuts.
	 * @return Array of `ShortcutItemProxy` objects.
	 */
	@Kroll.getProperty
	public ShortcutItemProxy[] staticItems()
	{
		if (!shortcutCapability || shortcutManager == null) {
			return null;
		}

		return toShortcutItems(shortcutManager.getPinnedShortcuts());
	}

	/**
	 * Add `ShortcutItemProxy` instance.
	 */
	@Kroll.method
	public void add(ShortcutItemProxy shortcut)
	{
		if (!shortcutCapability) {
			return;
		}

		// NOTE: Create the `ShortcutInfo` instance here, as the creation of `ShortcutInfo`
		// in `ShortcutItemProxy.handleCreationDict()` will soon be deprecated a removed.
		final Context context = TiApplication.getInstance();
		final ShortcutInfo.Builder shortcutBuilder = new ShortcutInfo.Builder(context, shortcut.getId());

		// Create shortcut intent.
		final Intent intent = new Intent(TiApplication.getAppRootOrCurrentActivity().getIntent());
		intent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_NEW_TASK);
		intent.setAction(Intent.ACTION_VIEW);
		intent.putExtra("shortcut", shortcut.getId());
		intent.putExtra("properties", shortcut.getProperties().toString());
		shortcutBuilder.setIntent(intent);

		shortcutBuilder.setShortLabel(shortcut.getTitle());
		shortcutBuilder.setLongLabel(shortcut.getDescription());

		// Handle shortcut icon.
		final Object icon = shortcut.getIcon();
		if (icon instanceof Number) {

			// Parse specified resource identifier.
			int resId = ((Number) icon).intValue();
			shortcutBuilder.setIcon(Icon.createWithResource(context, resId));

		} else if (icon instanceof String) {

			// Parse specified resource path.
			String uri = resolveUrl(null, (String) icon);
			shortcutBuilder.setIcon(Icon.createWithResource(context, TiUIHelper.getResourceId(uri)));
		}

		// Add shortcut.
		final List<ShortcutInfo> shortcuts = new ArrayList<>();
		shortcuts.add(shortcutBuilder.build());

		try {
			shortcutManager.addDynamicShortcuts(shortcuts);
		} catch (Exception e) {
			Log.w(TAG, e.getMessage());
		}
	}

	/**
	 * Remove `ShortcutItemProxy` instance.
	 */
	@Kroll.method
	public void remove(ShortcutItemProxy shortcut)
	{
		if (!shortcutCapability) {
			return;
		}

		// Remove shortcut.
		final List<String> ids = new ArrayList<>();
		ids.add(shortcut.getId());

		try {
			shortcutManager.removeDynamicShortcuts(ids);
		} catch (Exception e) {
			Log.w(TAG, e.getMessage());
		}
	}

	/**
	 * Remove all active shortcuts.
	 */
	@Kroll.method
	public void removeAll()
	{
		if (!shortcutCapability) {
			return;
		}

		// Remove all shortcuts.
		try {
			shortcutManager.removeAllDynamicShortcuts();
		} catch (Exception e) {
			Log.w(TAG, e.getMessage());
		}
	}

	@Override
	public String getApiName()
	{
		return "Ti.UI.Shortcut";
	}
}

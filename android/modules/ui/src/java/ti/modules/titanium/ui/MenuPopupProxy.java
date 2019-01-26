/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2019-present by Axway, Inc. All Rights Reserved.
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
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.view.TiUIView;
import org.appcelerator.titanium.util.TiRHelper;
import org.appcelerator.titanium.util.TiRHelper.ResourceNotFoundException;

import android.content.Context;
import android.widget.PopupMenu;
import android.view.View;
import android.view.MenuItem;

import java.util.Arrays;
import java.util.List;

@Kroll.proxy(creatableInModule = UIModule.class)
public class MenuPopupProxy extends KrollProxy
{
	private static final String TAG = "MenuPopupProxy";

	private Context context = null;

	private PopupMenu popup;

	private String[] items;

	public MenuPopupProxy()
	{
		super();

		context = TiApplication.getAppRootOrCurrentActivity();
	}

	public void handleCreationDict(KrollDict dict)
	{
		if (!dict.containsKey(TiC.PROPERTY_ITEMS)) {
			Log.e(TAG, "Missing required property \"items\"");
			return;
		}

		items = dict.getStringArray(TiC.PROPERTY_ITEMS);

		super.handleCreationDict(dict);
	}

	@Kroll.method
	public void show(KrollDict args)
	{
		Object tiView = properties.get(TiC.PROPERTY_VIEW);

		if (tiView == null) {
			Log.e(TAG, "Missing required property \"view\"");
			return;
		}

		if (!(tiView instanceof TiViewProxy)) {
			Log.e(TAG, "Property \"view\" must be a Titanium View, currently is " + tiView.getClass().getName());
			return;
		}

		TiViewProxy viewProxy = (TiViewProxy) tiView;
		TiUIView view = viewProxy.getOrCreateView();
		View anchor = view.getNativeView();

		PopupMenu popup = new PopupMenu(context, anchor);

		for (String title : items) {
			popup.getMenu().add(title);
		}

		try {
			popup.getMenuInflater().inflate(TiRHelper.getResource("menu.ti_ui_menu_popup"), popup.getMenu());
		} catch (TiRHelper.ResourceNotFoundException e) {
			if (Log.isDebugModeEnabled()) {
				Log.e(TAG, "XML resources could not be found!!!");
			}
			return;
		}

		popup.setOnMenuItemClickListener(new PopupMenu.OnMenuItemClickListener() {
			public boolean onMenuItemClick(MenuItem item)
			{
				KrollDict event = new KrollDict();

				int index = -1;

				for (int i = 0; i < items.length; i++) {
					String title = items[i];
					if (title == item.getTitle()) {
						index = i;
					}
				}

				event.put("title", item.getTitle());
				event.put("index", index);

				fireEvent(TiC.EVENT_CLICK, event);

				return true;
			}
		});

		popup.show();
	}

	@Override
	public String getApiName()
	{
		return "Ti.UI.MenuPopup";
	}
}

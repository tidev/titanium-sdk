/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package ti.modules.titanium.ui.widget.listview;

import java.util.HashMap;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiCompositeLayout.LayoutParams;
import org.appcelerator.titanium.view.TiUIView;

import android.view.View;
import android.view.View.OnClickListener;
import android.widget.ImageView;

import ti.modules.titanium.ui.UIModule;

public class TiListItem extends TiUIView
{

	View listItemLayout;
	public TiListItem(TiViewProxy proxy)
	{
		super(proxy);
	}

	public TiListItem(TiViewProxy proxy, LayoutParams p, View v, View item_layout)
	{
		super(proxy);
		layoutParams = p;
		listItemLayout = item_layout;
		setNativeView(v);
		registerForTouch(v);
		v.setFocusable(false);
	}

	public void processProperties(KrollDict d)
	{
		if (d.containsKey(TiC.PROPERTY_LAYOUT)) {
			d.remove(TiC.PROPERTY_LAYOUT);
		}
		if (d.containsKey(TiC.PROPERTY_ACCESSORY_TYPE)) {
			int accessory = TiConvert.toInt(d.get(TiC.PROPERTY_ACCESSORY_TYPE), -1);
			handleAccessory(accessory);
		}
		if (d.containsKey(TiC.PROPERTY_SELECTED_BACKGROUND_COLOR)) {
			d.put(TiC.PROPERTY_BACKGROUND_SELECTED_COLOR, d.get(TiC.PROPERTY_SELECTED_BACKGROUND_COLOR));
		}
		if (d.containsKey(TiC.PROPERTY_SELECTED_BACKGROUND_IMAGE)) {
			d.put(TiC.PROPERTY_BACKGROUND_SELECTED_IMAGE, d.get(TiC.PROPERTY_SELECTED_BACKGROUND_IMAGE));
		}
		super.processProperties(d);
	}

	private void handleAccessory(int accessory)
	{

		ImageView accessoryImage = (ImageView) listItemLayout.findViewById(TiListView.accessory);

		switch (accessory) {

			case UIModule.LIST_ACCESSORY_TYPE_CHECKMARK:
				accessoryImage.setImageResource(TiListView.isCheck);
				break;
			case UIModule.LIST_ACCESSORY_TYPE_DETAIL:
				accessoryImage.setImageResource(TiListView.hasChild);
				break;

			case UIModule.LIST_ACCESSORY_TYPE_DISCLOSURE:
				accessoryImage.setImageResource(TiListView.disclosure);
				break;

			default:
				accessoryImage.setImageResource(0);
		}
	}

	protected void setOnClickListener(View view)
	{
		view.setOnClickListener(new OnClickListener() {
			public void onClick(View view)
			{
				KrollDict data = dictFromEvent(lastUpEvent);
				handleFireItemClick(new KrollDict(data));
				fireEvent(TiC.EVENT_CLICK, data);
			}
		});
	}

	protected void handleFireItemClick(KrollDict data)
	{
		TiViewProxy listViewProxy = ((ListItemProxy) proxy).getListProxy();
		if (listViewProxy != null) {
			TiUIView listView = listViewProxy.peekView();
			if (listView != null) {
				KrollDict d = listView.getAdditionalEventData();
				if (d == null) {
					listView.setAdditionalEventData(new KrollDict((HashMap) additionalEventData));
				} else {
					d.clear();
					d.putAll(additionalEventData);
				}
				listView.fireEvent(TiC.EVENT_ITEM_CLICK, data);
			}
		}
	}

	public void release()
	{
		if (listItemLayout != null) {
			listItemLayout = null;
		}
		super.release();
	}
}

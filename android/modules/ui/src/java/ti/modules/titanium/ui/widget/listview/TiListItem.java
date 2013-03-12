/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
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

import ti.modules.titanium.ui.UIModule;
import android.view.View;
import android.view.View.OnClickListener;
import android.widget.ImageView;

public class TiListItem extends TiUIView {

	View listItemLayout;
	public TiListItem(TiViewProxy proxy) {
		super(proxy);
	}

	public TiListItem(TiViewProxy proxy, LayoutParams p, View v, View item_layout) {
		super(proxy);
		layoutParams = p;
		listItemLayout = item_layout;
		setNativeView(v);	
	}
	
	public void processProperties(KrollDict d) {
		
		if (d.containsKey(TiC.PROPERTY_ITEM_ID)) {
			String itemId = TiConvert.toString(d, TiC.PROPERTY_ITEM_ID);
			if (itemId != null && additionalEventData != null) {
				additionalEventData.put(TiC.PROPERTY_ITEM_ID, itemId);
			}
		} 
		
		if (d.containsKey(TiC.PROPERTY_ACCESSORY_TYPE)) {
			int color = -1;
			int accessory = TiConvert.toInt(d.get(TiC.PROPERTY_ACCESSORY_TYPE), -1);
			if (d.containsKey(TiC.PROPERTY_BACKGROUND_COLOR) && accessory != UIModule.LIST_ACCESSORY_TYPE_NONE) {
				color = TiConvert.toColor(d, TiC.PROPERTY_BACKGROUND_COLOR);
			}
			handleAccessory(accessory, color);
		} 
		
		super.processProperties(d);
	}

	private void handleAccessory(int accessory, int color) {
		ImageView accessoryImage = (ImageView) listItemLayout.findViewById(TiListView.accessory);
		if (color != -1) {
			accessoryImage.setBackgroundColor(color);
		}
		switch(accessory) {
		
		case UIModule.LIST_ACCESSORY_TYPE_CHECKMARK:
			accessoryImage.setImageResource(TiListView.isCheck);
			break;
		case UIModule.LIST_ACCESSORY_TYPE_DETAIL:
			accessoryImage.setImageResource(TiListView.hasChild);
			break;
		
	    default:
	    	accessoryImage.setImageResource(0);
		}
	}
	
	protected void setOnClickListener(View view)
	{
		view.setOnClickListener(new OnClickListener()
		{
			public void onClick(View view)
			{
				KrollDict data = dictFromEvent(lastUpEvent);
				TiViewProxy listViewProxy = proxy.getParent();
				if (listViewProxy != null) {
					TiUIView listView = listViewProxy.peekView();
					if (listView != null) {
						updateEventData(listView);
						listView.fireEvent(TiC.EVENT_ITEM_CLICK, data);
					}
				}
				fireEvent(TiC.EVENT_CLICK, data);
			}
		});
	}
	
	private void updateEventData(TiUIView listView) {
		KrollDict d = listView.getAdditionalEventData();
		if (d == null) {
			listView.setAdditionalEventData(new KrollDict((HashMap) additionalEventData.clone()));
		} else {
			d.putAll(additionalEventData);
		}
	}
	
	public void release() {
		if (listItemLayout != null) {
			listItemLayout = null;
		}
		super.release();
	}
	
}

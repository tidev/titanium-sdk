/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package ti.modules.titanium.ui.widget.listview;

import java.lang.ref.WeakReference;
import java.util.HashMap;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.view.TiUIView;

import android.app.Activity;

import ti.modules.titanium.ui.UIModule;

@Kroll.proxy(creatableInModule = UIModule.class)
public class ListItemProxy extends TiViewProxy
{
	protected WeakReference<TiViewProxy> listProxy;

	public TiUIView createView(Activity activity)
	{
		return new TiListItem(this);
	}

	public void setListProxy(TiViewProxy list)
	{
		listProxy = new WeakReference<TiViewProxy>(list);
	}

	public TiViewProxy getListProxy()
	{
		if (listProxy != null) {
			return listProxy.get();
		}
		return null;
	}

	public boolean fireEvent(final String event, final Object data, boolean bubbles)
	{
		fireItemClick(event, data);
		return super.fireEvent(event, data, bubbles);
	}

	private void fireItemClick(String event, Object data)
	{
		if (event.equals(TiC.EVENT_CLICK) && data instanceof HashMap) {
			KrollDict eventData = new KrollDict((HashMap) data);
			TiViewProxy source = (TiViewProxy) eventData.get(TiC.EVENT_PROPERTY_SOURCE);
			if (source != null && !source.equals(this) && listProxy != null) {

				// FIXME: We should not need to create a placeholder proxy for each item. ListView needs refactoring to remedy this.
				source = (TiViewProxy) KrollProxy.createProxy(source.getClass(), source.getKrollObject(), new Object[0],
															  source.getCreationUrl().url);
				eventData.put(TiC.EVENT_PROPERTY_SOURCE, source);

				// append bind properties
				if (eventData.containsKey(TiC.PROPERTY_BIND_ID) && eventData.containsKey(TiC.PROPERTY_ITEM_INDEX)
					&& eventData.containsKey(TiC.PROPERTY_SECTION)) {
					int itemIndex = eventData.getInt(TiC.PROPERTY_ITEM_INDEX);
					String bindId = eventData.getString(TiC.PROPERTY_BIND_ID);
					ListSectionProxy section = (ListSectionProxy) eventData.get(TiC.PROPERTY_SECTION);
					KrollDict itemProperties = section.getItemAt(itemIndex);
					if (itemProperties != null && itemProperties.containsKey(bindId)) {
						KrollDict properties = itemProperties.getKrollDict(bindId);
						for (String key : properties.keySet()) {
							source.setProperty(key, properties.get(key));
						}
						source.setProperty(TiC.PROPERTY_BIND_ID, bindId);
					}
				}
				TiViewProxy listViewProxy = listProxy.get();
				if (listViewProxy != null) {
					listViewProxy.fireEvent(TiC.EVENT_ITEM_CLICK, eventData);
				}
			}
		}
	}

	@Override
	public boolean hierarchyHasListener(String event)
	{
		// In order to fire the "itemclick" event when the children views are clicked,
		// the children views' "click" events must be fired and bubbled up. (TIMOB-14901)
		if (event.equals(TiC.EVENT_CLICK)) {
			return true;
		}
		return super.hierarchyHasListener(event);
	}

	public void release()
	{
		super.release();
		if (listProxy != null) {
			listProxy = null;
		}
	}

	@Override
	public String getApiName()
	{
		return "Ti.UI.ListItem";
	}
}

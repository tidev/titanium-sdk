/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget.tabgroup;

import java.util.HashMap;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.titanium.TiBaseActivity;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.ActivityProxy;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.TabGroupProxy;
import ti.modules.titanium.ui.TabProxy;

public abstract class TiUIAbstractTabGroup extends TiUIView {

	public TiUIAbstractTabGroup(TabGroupProxy proxy, TiBaseActivity activity) {
		super(proxy);
	}

	/**
	 * Add the provided tab to this group.
	 *
	 * Implementations may automatically select the first tab
	 * added, but must not call {@link TabGroupProxy#onTabSelected(TabProxy)}
	 * when doing so.
	 */
	public abstract void addTab(TabProxy tabProxy);

	/**
	 * Remove the tab from this group.
	 *
	 * @param tab the tab to remove from the group
	 */
	public abstract void removeTab(TabProxy tabProxy);

	/**
	 * Changes the selected tab of the group.
	 *
	 * @param tab the tab that will become selected
	 */
	public abstract void selectTab(TabProxy tabProxy);

	/**
	 * Returns the currently selected tab.
	 */
	public abstract TabProxy getSelectedTab();
	
	@Override
	public void processProperties(KrollDict d)
	{
		if (d.containsKey(TiC.PROPERTY_ACTIVITY)) {
			Object activityObject = d.get(TiC.PROPERTY_ACTIVITY);
			ActivityProxy activityProxy = getProxy().getActivityProxy();
			if (activityObject instanceof HashMap<?, ?> && activityProxy != null) {
				@SuppressWarnings("unchecked")
				KrollDict options = new KrollDict((HashMap<String, Object>) activityObject);
				activityProxy.handleCreationDict(options);
			}
		}

		super.processProperties(d);
	}

}

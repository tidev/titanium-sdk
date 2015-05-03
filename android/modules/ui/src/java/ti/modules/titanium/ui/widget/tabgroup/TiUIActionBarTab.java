/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget.tabgroup;

import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.util.TiUIHelper;

import ti.modules.titanium.ui.TabProxy;
import android.graphics.drawable.Drawable;
import android.os.Bundle;
import android.support.v4.app.Fragment;
import android.support.v7.app.ActionBar;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

@SuppressWarnings("deprecation")
public class TiUIActionBarTab extends TiUIAbstractTab {

	private static final String TAG = "TiUIActionBarTab";

	public static class TabFragment extends Fragment {
		private TiUIActionBarTab tab;

		public TabFragment() {
		}

		public void setTab(TiUIActionBarTab tab) {
			this.tab = tab;
		}

		public TiUIActionBarTab getTab() {
			return this.tab;
		}

		@Override
		public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
			if (tab == null) {
				return null;
			}
			return tab.getContentView();
		}
	}

	ActionBar.Tab tab;

	public TiUIActionBarTab(TabProxy proxy, ActionBar.Tab tab) {
		super(proxy);
		this.tab = tab;

		proxy.setModelListener(this);

		// Provide a reference to this instance by placing
		// a reference inside the "tag" slot that ActionBar.Tab provides.
		tab.setTag(this);

		Object title = proxy.getProperty(TiC.PROPERTY_TITLE);
		if (title != null) {
			tab.setText(title.toString());
		}
		Object url = proxy.getProperty(TiC.PROPERTY_ICON);
		if (url != null) {
			Drawable icon = TiUIHelper.getResourceDrawable(url);
			tab.setIcon(icon);
		}
		
	}

	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue, KrollProxy proxy) {
		if (key.equals(TiC.PROPERTY_TITLE)) {
			tab.setText(newValue.toString());
		}
		if (key.equals(TiC.PROPERTY_ICON)) {
			Drawable icon = null;
			if (newValue != null){
				icon = TiUIHelper.getResourceDrawable(newValue);
			}
			tab.setIcon(icon);
		}
	}
	
	/**
	 * Initialize this tab's fragment. Called by the tab group
	 * when the tab is first selected to create the fragment which
	 * will display the tab's content view.
	 */

	public TabFragment createFragment() {
		TabFragment fragment = new TabFragment();
		fragment.setTab(this);
		return fragment;
	}

	public void setTabOnFragment(TabFragment fragment) {
		fragment.setTab(this);
	}
}

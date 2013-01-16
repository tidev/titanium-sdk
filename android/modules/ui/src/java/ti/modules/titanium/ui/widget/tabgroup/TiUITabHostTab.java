/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget.tabgroup;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.util.TiUIHelper;

import ti.modules.titanium.ui.TabProxy;
import android.graphics.drawable.Drawable;
import android.view.View;
import android.widget.TabHost.TabSpec;

public class TiUITabHostTab extends TiUIAbstractTab {
	final String id = Integer.toHexString(hashCode());

	private View indicatorView;
	private Drawable defaultTabBackground;

	public TiUITabHostTab(TabProxy proxy) {
		super(proxy);
	}

	public void setBackgroundColor(int color) {
		indicatorView.setBackgroundColor(color);
	}

	void setupTabSpec(TabSpec spec) {
		KrollDict properties = proxy.getProperties();

		String title = properties.optString(TiC.PROPERTY_TITLE, "");
		Object icon = properties.get(TiC.PROPERTY_ICON);
		spec.setIndicator(title, icon != null ? TiUIHelper.getResourceDrawable(icon) : null);
	}

	void setIndicatorView(View indicatorView) {
		this.indicatorView = indicatorView;
		defaultTabBackground = indicatorView.getBackground();

		// Initialize custom background color of tab if provided.
		int tabBackgroundColor = ((TabProxy) proxy).getTabColor();
		if (tabBackgroundColor != 0) {
			setBackgroundColor(tabBackgroundColor);
		}
	}

	@Override
	public void onSelectionChange(boolean selected) {
		TabProxy tabProxy = (TabProxy) proxy;
		int backgroundColor;

		if (selected) {
			backgroundColor = tabProxy.getActiveTabColor();

		} else {
			backgroundColor = tabProxy.getTabColor();
			if (backgroundColor == 0) {
				// Restore to default background color.
				indicatorView.setBackgroundDrawable(defaultTabBackground);
			}
		}

		if (backgroundColor != 0) {
			setBackgroundColor(backgroundColor);
		}
	}

}

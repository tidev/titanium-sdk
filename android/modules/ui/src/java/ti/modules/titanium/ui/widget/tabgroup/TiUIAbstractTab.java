/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget.tabgroup;

import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiWindowProxy;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.TabProxy;
import ti.modules.titanium.ui.ViewProxy;
import android.graphics.Color;
import android.view.View;


public abstract class TiUIAbstractTab extends TiUIView {
	private TiUIView contentView;

	public TiUIAbstractTab(TabProxy proxy) {
		super(proxy);
		proxy.setView(this);
	}

	/**
	 * Called when the selection of this tab has changed.
	 *
	 * @param selected true if the tab is now selected or false if it was unselected.
	 */
	public void onSelectionChange(boolean selected) { }

	/**
	 * Returns the content view for this tab.
	 *
	 * @return the content view or null if the tab is empty
	 */
	public View getContentView() {
		if (contentView == null) {
			TiWindowProxy windowProxy = getWindowProxy();
			if (windowProxy == null) {
				// If no window is provided use an empty view.
				View emptyContent = new View(TiApplication.getInstance().getApplicationContext());
				emptyContent.setBackgroundColor(Color.BLACK);
				return emptyContent;
			}

			ViewProxy contentViewProxy = new ViewProxy();
			contentViewProxy.setActivity(windowProxy.getActivity());
			contentView = contentViewProxy.getOrCreateView();

			// Allow the window to fill the content view with its children.
			windowProxy.getKrollObject().setWindow(contentViewProxy);
		}

		return contentView.getNativeView();
	}

	private TiWindowProxy getWindowProxy() {
		Object windowProxy = proxy.getProperty(TiC.PROPERTY_WINDOW);
		if (windowProxy instanceof TiWindowProxy) {
			return (TiWindowProxy) windowProxy;
		}

		return null;
	}

}

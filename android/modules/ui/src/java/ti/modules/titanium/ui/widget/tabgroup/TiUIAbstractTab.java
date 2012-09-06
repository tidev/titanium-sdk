/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget.tabgroup;

import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiWindowProxy;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.TabProxy;
import ti.modules.titanium.ui.ViewProxy;
import android.view.View;


public abstract class TiUIAbstractTab extends TiUIView {
	private TiUIView contentView;

	public TiUIAbstractTab(TabProxy proxy) {
		super(proxy);
		proxy.setView(this);
	}

	/**
	 * Returns the content view for this tab.
	 *
	 * @return the content view or null if the tab is empty
	 */
	public View getContentView() {
		if (contentView == null) {
			TiWindowProxy windowProxy = getWindowProxy();
			if (windowProxy == null) {
				return null;
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

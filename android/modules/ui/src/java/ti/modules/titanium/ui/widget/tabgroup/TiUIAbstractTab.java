/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget.tabgroup;

import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.TabProxy;


public abstract class TiUIAbstractTab extends TiUIView {

	public TiUIAbstractTab(TabProxy proxy) {
		super(proxy);

		// We need to register for property changes from the proxy.
		proxy.setModelListener(this);
		proxy.setView(this);
	}

}

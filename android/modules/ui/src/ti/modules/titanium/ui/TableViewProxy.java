/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.widget.TiUITableView;
import android.app.Activity;

public class TableViewProxy extends TiViewProxy
{
	// data, original data set on a tableview?

	public TableViewProxy(TiContext tiContext, Object[] args) {
		super(tiContext, args);
	}

	@Override
	public TiUIView createView(Activity activity) {
		return new TiUITableView(this);
	}

	public void updateRow(Object row, TiDict data, TiDict options) {
		// row can be index or proxy
	}

	public void appendRow(TiDict data, TiDict options) {

	}

	public void deleteRow(Object row, TiDict options) {

	}

	public int getIndexByName(String name) {
		return -1;
	}

	public void insertRowBefore(Object row, TiDict data, TiDict options) {
		// data may be a row proxy, have to accept object.
	}

	public void insertRowAfter(Object row, TiDict data, TiDict options) {

	}

	public void scrollToIndex(int index, TiDict options) {

	}

	public void setData(Object[] data) {

	}
}

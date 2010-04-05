/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import java.util.ArrayList;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.AsyncResult;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.widget.tableview.TiTableViewRowProxyItem;
import ti.modules.titanium.ui.widget.tableview.TableViewModel.Item;
import android.app.Activity;
import android.os.Message;

public class TableViewRowProxy extends TiViewProxy
{
	protected ArrayList<TiViewProxy> controls;
	protected TiTableViewRowProxyItem tableViewItem;
	
	private static final int MSG_SET_DATA = TiViewProxy.MSG_LAST_ID + 5001;
	
	public TableViewRowProxy(TiContext tiContext, Object[] args) {
		super(tiContext, args);
	}

	@Override
	public TiUIView createView(Activity activity) {
		return null;
	}

	public ArrayList<TiViewProxy> getControls() {
		return controls;
	}

	public boolean hasControls() {
		return (controls != null && controls.size() > 0);
	}

	public void add(TiViewProxy control) {
		if (controls == null) {
			controls = new ArrayList<TiViewProxy>();
		}
		controls.add(control);
	}
	
	public void setTableViewItem(TiTableViewRowProxyItem item) {
		this.tableViewItem = item;
	}
	
	@Override
	public void setDynamicValue(String key, Object value) {
		super.setDynamicValue(key, value);
		if (tableViewItem != null) {
			Message msg = getUIHandler().obtainMessage(MSG_SET_DATA);
			msg.sendToTarget();
		}
	}
	
	@Override
	public boolean handleMessage(Message msg) {
		if (msg.what == MSG_SET_DATA) {
			tableViewItem.setRowData(this);
			return true;
		}
		return super.handleMessage(msg);
	}
	
	@Override
	public String toString() {
		return "[object TiUITableViewRow]";
	}
}

/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import java.util.ArrayList;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.TiProxy;
import org.appcelerator.titanium.bridge.OnEventListenerChange;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.widget.tableview.TableViewModel;
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
	
	public TiViewProxy[] getChildren() {
		return controls.toArray(new TiViewProxy[controls.size()]);
	}

	public boolean hasControls() {
		return (controls != null && controls.size() > 0);
	}

	public void add(TiViewProxy control) {
		if (controls == null) {
			controls = new ArrayList<TiViewProxy>();
		}
		controls.add(control);
		control.setParent(this);
	}
	
	public void setTableViewItem(TiTableViewRowProxyItem item) {
		this.tableViewItem = item;
	}
	
	public TableViewProxy getTable() {
		TiViewProxy parent = getParent();
		while (!(parent instanceof TableViewProxy) && parent != null) {
			parent = parent.getParent();
		}
		return (TableViewProxy)parent;
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
	
	@Override
	public boolean fireEvent(String eventName, TiDict data) {
		if (eventName.equals("click")) {
			// inject row click data for events coming from row children
			TableViewProxy table = getTable();
			Item item = tableViewItem.getRowData();
			if (table != null && item != null) {
				TableViewModel model = table.getTableView().getModel();
				data.put("rowData", item.rowData);
				data.put("section", model.getSection(item.sectionIndex));
				data.put("row", item.proxy);
				data.put("index", item.index);
				data.put("detail", false);
			}
		}
		
		return super.fireEvent(eventName, data);
	}
	
	public void setLabelsClickable(boolean clickable) {
		if (controls != null) {
			for (TiViewProxy control : controls) {
				if (control instanceof LabelProxy) {
					((LabelProxy)control).setClickable(clickable);
				}
			}
		}
	}

	@Override
	public void releaseViews()
	{
		super.releaseViews();
		if (tableViewItem != null) {
			tableViewItem.release();
			tableViewItem = null;
		}
		if (controls != null){
			for (TiViewProxy control : controls) {
				control.releaseViews();
			}
			controls.clear();
		}
	}
}

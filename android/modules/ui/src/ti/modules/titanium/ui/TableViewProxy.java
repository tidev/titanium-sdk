/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import java.util.ArrayList;
import java.util.Arrays;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.TiProxy;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.AsyncResult;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.widget.TiUITableView;
import android.app.Activity;
import android.os.Message;

public class TableViewProxy extends TiViewProxy
{
	private static final String LCAT = "TableViewProxyl";
	@SuppressWarnings("unused")
	private static final boolean DBG = TiConfig.LOGD;

	private static final int INSERT_ROW_BEFORE = 0;
	private static final int INSERT_ROW_AFTER = 1;
	
	private static final int MSG_UPDATE_VIEW = TiViewProxy.MSG_LAST_ID + 5001;
	private static final int MSG_SCROLL_TO_INDEX = TiViewProxy.MSG_LAST_ID + 5002;
	private static final int MSG_SET_DATA = TiViewProxy.MSG_LAST_ID + 5003;
	private static final int MSG_DELETE_ROW = TiViewProxy.MSG_LAST_ID + 5004;
	private static final int MSG_INSERT_ROW = TiViewProxy.MSG_LAST_ID + 5005;
	private static final int MSG_APPEND_ROW = TiViewProxy.MSG_LAST_ID + 5006;
	
	public static final String CLASSNAME_DEFAULT = "__default__";
	public static final String CLASSNAME_HEADER = "__header__";
	public static final String CLASSNAME_NORMAL = "__normal__";

	class RowResult {
		int sectionIndex;
		TableViewSectionProxy section;
		TableViewRowProxy row;
		int rowIndexInSection;
	}

	private ArrayList<TableViewSectionProxy> localSections;

	public TableViewProxy(TiContext tiContext, Object[] args) {
		super(tiContext, args);
		
		tiContext.addOnEventChangeListener(this);
		Object o = getDynamicValue("data");
		if (o != null) {
			processData((Object[]) o);
			getDynamicProperties().remove("data"); // don't hide getData
		}
	}

	@Override
	public void releaseViews()
	{
		super.releaseViews();
		if (localSections != null) {
			for (TableViewSectionProxy section : localSections) {
				section.releaseViews();
			}
		}
		localSections.clear();
	}

	@Override
	public TiUIView createView(Activity activity) {
		return new TiUITableView(this);
	}

	public TiUITableView getTableView() {
		TiContext ctx = getTiContext();
		if (ctx != null) {
			return (TiUITableView) getView(ctx.getActivity());
		} 
		return null;
	}
	
	public void updateRow(Object row, Object data, TiDict options) {
		TableViewRowProxy rowProxy = null;
		TableViewSectionProxy sectionProxy = null;
		int rowIndex = -1;
		
		if (row instanceof Number) {
			RowResult rr = new RowResult();

			rowIndex = ((Number)row).intValue();
			locateIndex(rowIndex, rr);
			rowProxy = rr.row;
			sectionProxy = rr.section;
		} else if (row instanceof TableViewRowProxy) {
			ArrayList<TableViewSectionProxy> sections = getSections();
			sectionLoop: for (int i = 0; i < sections.size(); i++) {
				ArrayList<TableViewRowProxy> rows = sections.get(i).rows;
				for (int j = 0; j < rows.size(); j++) {
					if (rows.get(j) == row) {
						rowProxy = (TableViewRowProxy)row;
						sectionProxy = sections.get(i);
						rowIndex = j;
						break sectionLoop;
					}
				}
			}
		}
		
		if (sectionProxy != null) {
			sectionProxy.updateRowAt(rowIndex, rowProxyFor(data));
			getTableView().setModelDirty();
			updateView();
		}
	}

	public void appendRow(Object row, TiDict options)
	{
		TiContext ctx = getTiContext();
		if (ctx == null) {
			Log.w(LCAT, "Context has been GC'd, not appending row");
			return;
		}
		if (ctx.isUIThread()) {
			handleAppendRow(row);
			return;
		}
		
		AsyncResult result = new AsyncResult(row);
		Message msg = getUIHandler().obtainMessage(MSG_APPEND_ROW, result);
		msg.sendToTarget();
		result.getResult();
	}
	
	private void handleAppendRow(Object row)
	{
		TableViewRowProxy rowProxy = rowProxyFor(row);
		
		ArrayList<TableViewSectionProxy> sections = getSections();
		if (sections.size() == 0) {
			Object[] data = { rowProxy };
			processData(data);
		} else {
			TableViewSectionProxy lastSection = sections.get(sections.size() - 1);
			rowProxy.setDynamicValue("section", lastSection);
			rowProxy.setDynamicValue("parent", lastSection);

			lastSection.insertRowAt((int) lastSection.getRowCount(), rowProxy);
			getTableView().setModelDirty();
		}
		
		updateView();
	}

	public void deleteRow(int index, TiDict options)
	{
		TiContext ctx = getTiContext();
		if (ctx == null) {
			Log.w(LCAT, "Context has been GC'd, not deleting row.");
			return;
		}
		if (ctx.isUIThread()) {
			handleDeleteRow(index);
			return;
		}
		Message msg = getUIHandler().obtainMessage(MSG_DELETE_ROW);
		msg.arg1 = index;
		msg.sendToTarget();

	}
	
	private void handleDeleteRow(int index)
	{
		RowResult rr = new RowResult();
		if (locateIndex(index, rr)) {
			rr.section.removeRowAt(rr.rowIndexInSection);
			getTableView().setModelDirty();
			updateView();
		} else {
			throw new IllegalStateException(
				"Index out of range. Non-existant row at " + index);
		}
	}

	public int getIndexByName(String name) {
		int index = -1;
		int idx = 0;
		if (name != null) {
			for (TableViewSectionProxy section : getSections()) {
				for (TableViewRowProxy row : section.getRows()) {
					String rname = TiConvert.toString(row.getDynamicValue("name"));
					if (rname != null && name.equals(rname)) {
						index = idx;
						break;
					}
					idx++;
				}
				if (index > -1) {
					break;
				}
			}
		}
		return index;
	}

	public void insertRowBefore(int index, Object data, TiDict options) {
		TiContext ctx = getTiContext();
		if (ctx == null) {
			Log.w(LCAT, "Context has been GC'd, not inserting row");
			return;
		}
		if (ctx.isUIThread()) {
			handleInsertRowBefore(index, data);
			return;
		}
		AsyncResult result = new AsyncResult(data);
		Message msg = getUIHandler().obtainMessage(MSG_INSERT_ROW, result);
		msg.arg1 = INSERT_ROW_BEFORE;
		msg.arg2 = index;
		msg.sendToTarget();
		result.getResult();
	}
	
	private void handleInsertRowBefore(int index, Object data) {
		if (getSections().size() > 0) {
			if (index < 0) {
				index = 0;
			}

			RowResult rr = new RowResult();
			if (locateIndex(index, rr)) {
				TableViewRowProxy rowProxy = rowProxyFor(data);
				rr.section.insertRowAt(rr.rowIndexInSection, rowProxy);
			} else {
				throw new IllegalStateException(
					"Index out of range. Non-existant row at " + index);
			}
		} else {
			// Add first row.
			Object[] args = { rowProxyFor(data) };
			processData(args);
		}
		getTableView().setModelDirty();
		updateView();
	}

	public void insertRowAfter(int index, Object data, TiDict options) {
		TiContext ctx = getTiContext();
		if (ctx == null) {
			Log.w(LCAT, "Context has been GC'd, not inserting row.");
			return;
		}
		if (ctx.isUIThread()) {
			handleInsertRowAfter(index, data);
			return;
		}
		AsyncResult result = new AsyncResult(data);
		Message msg = getUIHandler().obtainMessage(MSG_INSERT_ROW, result);
		msg.arg1 = INSERT_ROW_AFTER;
		msg.arg2 = index;
		msg.sendToTarget();
		result.getResult();
	}
	
	private void handleInsertRowAfter(int index, Object data) {
		RowResult rr = new RowResult();
		if (locateIndex(index, rr)) {
			// TODO check for section
			TableViewRowProxy rowProxy = rowProxyFor(data);
			rr.section.insertRowAt(rr.rowIndexInSection + 1, rowProxy);
			getTableView().setModelDirty();
			updateView();
		} else {
			throw new IllegalStateException(
				"Index out of range. Non-existant row at " + index);
		}
	}

	public void scrollToIndex(int index, TiDict options) {
		getTableView().scrollToIndex(index);
	}

	@SuppressWarnings("unchecked")
	public ArrayList<TableViewSectionProxy> getSections()
	{
		ArrayList<TableViewSectionProxy> sections = localSections;
		if (sections == null) {
			sections = new ArrayList<TableViewSectionProxy>();
			localSections = sections;
		}
		return sections;
	}
	
	public void processData(Object[] data) {
		ArrayList<TableViewSectionProxy> sections = getSections();
		sections.clear();

		TableViewSectionProxy currentSection = null;

		for (int i = 0; i < data.length; i++) {
			Object o = data[i];

			if (o instanceof TiDict) {
				TiDict d = (TiDict) o;
				Object[] args = { d };
				TableViewRowProxy rowProxy = new TableViewRowProxy(getTiContext(), args);
				rowProxy.setDynamicValue("className", CLASSNAME_NORMAL);
				rowProxy.setDynamicValue("rowData", data);
				rowProxy.setParent(this);

				if (currentSection == null || d.containsKey("header")) {
					currentSection = new TableViewSectionProxy(getTiContext(), new Object[0]);
					sections.add(currentSection);
				}
				if (d.containsKey("header")) {
					currentSection.setDynamicValue("headerTitle", d.get("header"));
				}
				if (d.containsKey("footer")) {
					currentSection.setDynamicValue("footerTitle", d.get("footer"));
				}
				currentSection.add(rowProxy);
			} else if (o instanceof TableViewRowProxy) {
				TableViewRowProxy rowProxy = (TableViewRowProxy) o;
				TiDict d = rowProxy.getDynamicProperties();
				rowProxy.setParent(this);

				if (currentSection == null || d.containsKey("header")) {
					currentSection = new TableViewSectionProxy(getTiContext(), new Object[0]);
					sections.add(currentSection);
				}
				if (d.containsKey("header")) {
					currentSection.setDynamicValue("headerTitle", d.get("header"));
				}
				if (d.containsKey("footer")) {
					currentSection.setDynamicValue("footerTitle", d.get("footer"));
				}

				currentSection.add((TableViewRowProxy) o);
			} else if (o instanceof TableViewSectionProxy) {
				currentSection = (TableViewSectionProxy) o;
				sections.add(currentSection);
				currentSection.setParent(this);
			}
		}
	}

	public void setData(Object[] data, TiDict options) {
		TiContext ctx = getTiContext();
		if (ctx == null) {
			Log.w(LCAT, "Context has been GC'd, not setting table data.");
			return;
		}
		if (ctx.isUIThread()) {
			handleSetData(data);
		} else {
			AsyncResult result = new AsyncResult(data);
			Message msg = getUIHandler().obtainMessage(MSG_SET_DATA, result);
			msg.sendToTarget();
			result.getResult();
		}
	}
	
	private void handleSetData(Object[] data) {
		if (data != null) {
			processData(data);
			getTableView().setModelDirty();
			updateView();
		} 
	}
	
	public Object[] getData() {
		ArrayList<TableViewSectionProxy> sections = getSections();
		if (sections != null) {
			return sections.toArray();
		}
		
		return new Object[0];		
	}

	private TableViewRowProxy rowProxyFor(Object row) {
		TableViewRowProxy rowProxy = null;
		if (row instanceof TiDict) {
			TiDict d = (TiDict) row;
			Object[] args = { d };
			rowProxy = new TableViewRowProxy(getTiContext(), args);
			rowProxy.setDynamicValue("className", CLASSNAME_NORMAL);
			rowProxy.setDynamicValue("rowData", row);
		} else {
			rowProxy = (TableViewRowProxy) row;
		}
		
		rowProxy.setParent(this);
		return rowProxy;
	}

	private boolean locateIndex(int index, RowResult rowResult) {
		boolean found = false;
		int rowCount = 0;
		int sectionIndex = 0;

		for (TableViewSectionProxy section : getSections()) {
			int sectionRowCount = (int) section.getRowCount();
			if (sectionRowCount + rowCount > index) {
				rowResult.section = section;
				rowResult.sectionIndex = sectionIndex;
				rowResult.row = section.getRows()[index - rowCount];
				rowResult.rowIndexInSection = index - rowCount;
				found = true;
				break;
			} else {
				rowCount += sectionRowCount;
			}

			sectionIndex += 1;
		}

		return found;
	}

	public void updateView() {
		if (getTiContext().isUIThread()) {
			getTableView().updateView();
			return;
		}
		AsyncResult result = new AsyncResult();
		Message msg = getUIHandler().obtainMessage(MSG_UPDATE_VIEW);
		msg.obj = result;
		msg.sendToTarget();
		result.getResult();
	}

	public void scrollToIndex(int index) {
		Message msg = getUIHandler().obtainMessage(MSG_SCROLL_TO_INDEX);
		msg.arg1 = index;
		msg.sendToTarget();
	}

	@Override
	public boolean handleMessage(Message msg) {
		if (msg.what == MSG_UPDATE_VIEW) {
			getTableView().updateView();
			((AsyncResult) msg.obj).setResult(0);
			return true;
		} else if (msg.what == MSG_SCROLL_TO_INDEX) {
			getTableView().scrollToIndex(msg.arg1);
			return true;
		} else if (msg.what == MSG_SET_DATA) {
			AsyncResult result = (AsyncResult) msg.obj;
			Object[] data = (Object[]) result.getArg();
			handleSetData(data);
			result.setResult(0);
			return true;
		} else if (msg.what == MSG_INSERT_ROW) {
			AsyncResult result = (AsyncResult) msg.obj;
			if (msg.arg1 == INSERT_ROW_AFTER) {
				handleInsertRowAfter(msg.arg2, result.getArg());
			} else {
				handleInsertRowBefore(msg.arg2, result.getArg());
			}
			result.setResult(0);
			return true;
		} else if (msg.what == MSG_APPEND_ROW) {
			AsyncResult result = (AsyncResult) msg.obj;
			handleAppendRow(result.getArg());
			result.setResult(0);
			return true;
		} else if (msg.what == MSG_DELETE_ROW) {
			handleDeleteRow(msg.arg1);
			return true;
		}

		return super.handleMessage(msg);
	}
	

	// labels only send out click events when they are explicitly told to do so.
	// we need to tell each label child to enable clicks when a click listener is added
	@Override
	public void eventListenerAdded(String eventName, int count, TiProxy proxy) {
		super.eventListenerAdded(eventName, count, proxy);
		if (eventName.equals("click") && proxy == this) {
			for (TableViewSectionProxy section : getSections()) {
				for (TableViewRowProxy row : section.getRows()) {
					row.setLabelsClickable(true);
				}
			}
		}
	}
	
	@Override
	public void eventListenerRemoved(String eventName, int count, TiProxy proxy) {
		super.eventListenerRemoved(eventName, count, proxy);
		if (eventName.equals("click") && count == 0 && proxy == this) {
			for (TableViewSectionProxy section : getSections()) {
				for (TableViewRowProxy row : section.getRows()) {
					row.setLabelsClickable(false);
				}
			}
		}
	}
}

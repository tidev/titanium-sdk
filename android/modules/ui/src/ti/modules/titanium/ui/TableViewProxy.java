/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import java.util.ArrayList;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.AsyncResult;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.widget.TiUITableView;
import android.app.Activity;
import android.os.Message;

@Kroll.proxy(creatableInModule=UIModule.class)
public class TableViewProxy extends TiViewProxy
{
	private static final String LCAT = "TableViewProxy";
	private static final boolean DBG = TiConfig.LOGD;

	private static final int INSERT_ROW_BEFORE = 0;
	private static final int INSERT_ROW_AFTER = 1;
	
	private static final int MSG_UPDATE_VIEW = TiViewProxy.MSG_LAST_ID + 5001;
	private static final int MSG_SCROLL_TO_INDEX = TiViewProxy.MSG_LAST_ID + 5002;
	private static final int MSG_SET_DATA = TiViewProxy.MSG_LAST_ID + 5003;
	private static final int MSG_DELETE_ROW = TiViewProxy.MSG_LAST_ID + 5004;
	private static final int MSG_INSERT_ROW = TiViewProxy.MSG_LAST_ID + 5005;
	private static final int MSG_APPEND_ROW = TiViewProxy.MSG_LAST_ID + 5006;
	private static final int MSG_SCROLL_TO_TOP = TiViewProxy.MSG_LAST_ID + 5007;

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

	public TableViewProxy(TiContext tiContext) {
		super(tiContext);
		
		eventManager.addOnEventChangeListener(this);
	}
	
	@Override
	public void handleCreationDict(KrollDict dict) {
		Object data[] = null;
		if (dict.containsKey(TiC.PROPERTY_DATA)) {
			Object o = dict.get(TiC.PROPERTY_DATA);
			if (o != null && o instanceof Object[]) {
				data = (Object[]) o;
				dict.remove(TiC.PROPERTY_DATA); // don't override our data accessor
			}
		}
		super.handleCreationDict(dict);
		if (data != null) {
			processData(data);
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

	@Kroll.method
	public void updateRow(Object row, Object data, @Kroll.argument(optional=true) KrollDict options) {
		TableViewSectionProxy sectionProxy = null;
		int rowIndex = -1;
		if (row instanceof Number) {
			RowResult rr = new RowResult();
			rowIndex = ((Number)row).intValue();
			locateIndex(rowIndex, rr);
			sectionProxy = rr.section;
		} else if (row instanceof TableViewRowProxy) {
			ArrayList<TableViewSectionProxy> sections = getLocalSections();
			sectionLoop: for (int i = 0; i < sections.size(); i++) {
				ArrayList<TableViewRowProxy> rows = sections.get(i).rows;
				for (int j = 0; j < rows.size(); j++) {
					if (rows.get(j) == row) {
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

	@Kroll.method
	public void appendRow(Object row, @Kroll.argument(optional=true) KrollDict options) {
		TiContext ctx = getTiContext();
		if (ctx == null) {
			Log.w(LCAT, "Context has been GC'd, not appending row");
			return;
		}
		if (ctx.isUIThread()) {
			handleAppendRow(row);
			return;
		}

		sendBlockingUiMessage(MSG_APPEND_ROW, row);
	}

	private void handleAppendRow(Object row) {
		TableViewRowProxy rowProxy = rowProxyFor(row);
		ArrayList<TableViewSectionProxy> sections = getLocalSections();
		if (sections.size() == 0) {
			Object[] data = { rowProxy };
			processData(data);
		} else {
			TableViewSectionProxy lastSection = sections.get(sections.size() - 1);
			TableViewSectionProxy addedToSection = addRowToSection(rowProxy, lastSection);
			if (lastSection == null || !lastSection.equals(addedToSection)) {
				sections.add(addedToSection);
			}
			rowProxy.setProperty(TiC.PROPERTY_SECTION, addedToSection);
			rowProxy.setProperty(TiC.PROPERTY_PARENT, addedToSection);
		}
		getTableView().setModelDirty();
		updateView();
	}

	@Kroll.method
	public void deleteRow(int index, @Kroll.argument(optional=true) KrollDict options) {
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

	private void handleDeleteRow(int index) {
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

	@Kroll.method
	public int getIndexByName(String name) {
		int index = -1;
		int idx = 0;
		if (name != null) {
			for (TableViewSectionProxy section : getLocalSections()) {
				for (TableViewRowProxy row : section.getRows()) {
					String rname = TiConvert.toString(row.getProperty(TiC.PROPERTY_NAME));
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

	@Kroll.method
	public void insertRowBefore(int index, Object data, @Kroll.argument(optional=true) KrollDict options) {
		TiContext ctx = getTiContext();
		if (ctx == null) {
			Log.w(LCAT, "Context has been GC'd, not inserting row");
			return;
		}
		if (ctx.isUIThread()) {
			handleInsertRowBefore(index, data);
			return;
		}

		sendBlockingUiMessage(MSG_INSERT_ROW, data, INSERT_ROW_BEFORE, index);
	}
	
	private void handleInsertRowBefore(int index, Object data) {
		if (getLocalSections().size() > 0) {
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

	@Kroll.method
	public void insertRowAfter(int index, Object data, @Kroll.argument(optional=true) KrollDict options) {
		TiContext ctx = getTiContext();
		if (ctx == null) {
			Log.w(LCAT, "Context has been GC'd, not inserting row.");
			return;
		}
		if (ctx.isUIThread()) {
			handleInsertRowAfter(index, data);
			return;
		}
		sendBlockingUiMessage(MSG_INSERT_ROW, data, INSERT_ROW_AFTER, index);
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

	@Kroll.getProperty @Kroll.method
	public Object[] getSections()
	{
		return getData();
	}
	
	public ArrayList<TableViewSectionProxy> getLocalSections()
	{
		ArrayList<TableViewSectionProxy> sections = localSections;
		if (sections == null) {
			sections = new ArrayList<TableViewSectionProxy>();
			localSections = sections;
		}
		return sections;
	}

	/**
	 * If the row does not carry section information, it will be added
	 * to the currentSection.  If it does carry section information (i.e., a header), 
	 * that section will be created and the row added to it.  Either way,
	 * whichever section the row gets added to will be returned.
	 */
	private TableViewSectionProxy addRowToSection(TableViewRowProxy row, TableViewSectionProxy currentSection)
	{
		KrollDict d = row.getProperties();
		TableViewSectionProxy addedToSection = null;
		if (currentSection == null || d.containsKey(TiC.PROPERTY_HEADER)) {
			addedToSection = new TableViewSectionProxy(getTiContext());
		} else {
			addedToSection = currentSection;
		}
		if (d.containsKey(TiC.PROPERTY_HEADER)) {
			addedToSection.setProperty(TiC.PROPERTY_HEADER_TITLE, d.get(TiC.PROPERTY_HEADER));
		}
		if (d.containsKey(TiC.PROPERTY_FOOTER)) {
			addedToSection.setProperty(TiC.PROPERTY_FOOTER_TITLE, d.get(TiC.PROPERTY_FOOTER));
		}
		addedToSection.add(row);
		return addedToSection;
	}
	public void processData(Object[] data)
	{
		ArrayList<TableViewSectionProxy> sections = getLocalSections();
		sections.clear();

		TableViewSectionProxy currentSection = null;
		if (hasProperty(TiC.PROPERTY_HEADER_TITLE)) {
			currentSection = new TableViewSectionProxy(context);
			sections.add(currentSection);
			currentSection.setProperty(TiC.PROPERTY_HEADER_TITLE, getProperty(TiC.PROPERTY_HEADER_TITLE));
		}
		if (hasProperty(TiC.PROPERTY_FOOTER_TITLE)) {
			if (currentSection == null) {
				currentSection = new TableViewSectionProxy(context);
				sections.add(currentSection);
			}
			currentSection.setProperty(TiC.PROPERTY_FOOTER_TITLE, getProperty(TiC.PROPERTY_FOOTER_TITLE));
		}

		for (int i = 0; i < data.length; i++) {
			Object o = data[i];
			if (o instanceof KrollDict || o instanceof TableViewRowProxy) {
				TableViewRowProxy rowProxy = rowProxyFor(o);
				TableViewSectionProxy addedToSection = addRowToSection(rowProxy, currentSection);
				if (currentSection == null || !currentSection.equals(addedToSection)) {
					currentSection = addedToSection;
					sections.add(currentSection);
				}
			} else if (o instanceof TableViewSectionProxy) {
				currentSection = (TableViewSectionProxy) o;
				sections.add(currentSection);
				currentSection.setParent(this);
			}
		}
	}

	@Kroll.setProperty @Kroll.method
	public void setData(Object[] data, @Kroll.argument(optional=true) KrollDict options) {
		TiContext ctx = getTiContext();
		Object[] actualData = data;
		if (data != null && data.length > 0 && data[0] instanceof Object[]) {
			actualData = (Object[]) data[0];
		}
		if (ctx == null) {
			Log.w(LCAT, "Context has been GC'd, not setting table data.");
			return;
		}
		if (ctx.isUIThread()) {
			handleSetData(actualData);
		} else {
			sendBlockingUiMessage(MSG_SET_DATA, actualData);
		}
	}
	
	private void handleSetData(Object[] data) {
		if (data != null) {
			processData(data);
			getTableView().setModelDirty();
			updateView();
		} 
	}
	
	@Kroll.getProperty @Kroll.method
	public Object[] getData() {
		ArrayList<TableViewSectionProxy> sections = getLocalSections();
		if (sections != null) {
			return sections.toArray();
		}
		
		return new Object[0];
	}

	private TableViewRowProxy rowProxyFor(Object row) {
		TableViewRowProxy rowProxy = null;
		if (row instanceof KrollDict) {
			KrollDict d = (KrollDict) row;
			rowProxy = new TableViewRowProxy(getTiContext());
			rowProxy.handleCreationDict(d);
			rowProxy.setProperty(TiC.PROPERTY_CLASS_NAME, CLASSNAME_NORMAL);
			rowProxy.setProperty(TiC.PROPERTY_ROW_DATA, row);
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

		for (TableViewSectionProxy section : getLocalSections()) {
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
		sendBlockingUiMessage(MSG_UPDATE_VIEW, null);
	}

	@Kroll.method
	public void scrollToIndex(int index) {
		Message msg = getUIHandler().obtainMessage(MSG_SCROLL_TO_INDEX);
		msg.arg1 = index;
		msg.sendToTarget();
	}

	@Kroll.method
	public void scrollToTop(int index) {
		Message msg = getUIHandler().obtainMessage(MSG_SCROLL_TO_TOP);
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
		} else if (msg.what == MSG_SCROLL_TO_TOP) {
			getTableView().scrollToTop(msg.arg1);
			return true;
		}

		return super.handleMessage(msg);
	}

	// labels only send out click events when they are explicitly told to do so.
	// we need to tell each label child to enable clicks when a click listener is added
	@Override
	public void eventListenerAdded(String eventName, int count, KrollProxy proxy) {
		super.eventListenerAdded(eventName, count, proxy);
		if (eventName.equals(TiC.EVENT_CLICK) && proxy == this) {
			for (TableViewSectionProxy section : getLocalSections()) {
				for (TableViewRowProxy row : section.getRows()) {
					row.setLabelsClickable(true);
				}
			}
		}
	}
	
	@Override
	public void eventListenerRemoved(String eventName, int count, KrollProxy proxy) {
		super.eventListenerRemoved(eventName, count, proxy);
		if (eventName.equals(TiC.EVENT_CLICK) && count == 0 && proxy == this) {
			for (TableViewSectionProxy section : getLocalSections()) {
				for (TableViewRowProxy row : section.getRows()) {
					row.setLabelsClickable(false);
				}
			}
		}
	}
}

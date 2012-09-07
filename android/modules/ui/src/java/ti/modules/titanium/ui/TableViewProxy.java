/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import java.util.ArrayList;
import java.util.HashMap;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.AsyncResult;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.kroll.common.TiMessenger;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.widget.TiUITableView;
import ti.modules.titanium.ui.widget.tableview.TableViewModel.Item;
import android.app.Activity;
import android.os.Message;

@Kroll.proxy(creatableInModule = UIModule.class, propertyAccessors = { 
	TiC.PROPERTY_FILTER_ATTRIBUTE,
	TiC.PROPERTY_FILTER_CASE_INSENSITIVE,
	TiC.PROPERTY_HEADER_TITLE,
	TiC.PROPERTY_HEADER_VIEW,
	TiC.PROPERTY_FOOTER_TITLE,
	TiC.PROPERTY_FOOTER_VIEW,
	TiC.PROPERTY_SEARCH,
	TiC.PROPERTY_SEPARATOR_COLOR
})
public class TableViewProxy extends TiViewProxy
{
	private static final String TAG = "TableViewProxy";

	private static final int INSERT_ROW_BEFORE = 0;
	private static final int INSERT_ROW_AFTER = 1;
	private static final int INSERT_SECTION_BEFORE = 0;
	private static final int INSERT_SECTION_AFTER = 1;

	private static final int MSG_UPDATE_VIEW = TiViewProxy.MSG_LAST_ID + 5001;
	private static final int MSG_SCROLL_TO_INDEX = TiViewProxy.MSG_LAST_ID + 5002;
	private static final int MSG_SET_DATA = TiViewProxy.MSG_LAST_ID + 5003;
	private static final int MSG_DELETE_ROW = TiViewProxy.MSG_LAST_ID + 5004;
	private static final int MSG_INSERT_ROW = TiViewProxy.MSG_LAST_ID + 5005;
	private static final int MSG_APPEND_ROW = TiViewProxy.MSG_LAST_ID + 5006;
	private static final int MSG_SCROLL_TO_TOP = TiViewProxy.MSG_LAST_ID + 5007;
	private static final int MSG_SELECT_ROW = TiViewProxy.MSG_LAST_ID + 5008;
	private static final int MSG_APPEND_SECTION = TiViewProxy.MSG_LAST_ID + 5009;
	private static final int MSG_DELETE_SECTION = TiViewProxy.MSG_LAST_ID + 5010;
	private static final int MSG_INSERT_SECTION = TiViewProxy.MSG_LAST_ID + 5011;

	public static final String CLASSNAME_DEFAULT = "__default__";
	public static final String CLASSNAME_HEADER = "__header__";
	public static final String CLASSNAME_HEADERVIEW = "__headerView__";
	public static final String CLASSNAME_NORMAL = "__normal__";

	class RowResult
	{
		int sectionIndex;
		TableViewSectionProxy section;
		TableViewRowProxy row;
		int rowIndexInSection;
	}

	private ArrayList<TableViewSectionProxy> localSections;

	public TableViewProxy()
	{
		super();

		// eventManager.addOnEventChangeListener(this);
	}

	public TableViewProxy(TiContext tiContext)
	{
		this();
	}

	@Override
	public void handleCreationDict(KrollDict dict)
	{
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
	public void setActivity(Activity activity)
	{
		super.setActivity(activity);
		if (localSections != null) {
			for (TableViewSectionProxy section : localSections) {
				section.setActivity(activity);
			}
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
	public TiUIView createView(Activity activity)
	{
		return new TiUITableView(this);
	}

	public TiUITableView getTableView()
	{
		return (TiUITableView) getOrCreateView();
	}

	@Override
	public boolean fireEvent(String eventName, Object data) {
		if (eventName.equals(TiC.EVENT_LONGPRESS)) {
			// The data object may already be in use by the runtime thread
			// due to a child view's event fire. Create a copy to be thread safe.
			KrollDict dataCopy = new KrollDict((KrollDict)data);
			double x = dataCopy.getDouble(TiC.PROPERTY_X);
			double y = dataCopy.getDouble(TiC.PROPERTY_Y);
			int index = getTableView().getTableView().getIndexFromXY(x, y);
			if (index != -1) {
				Item item = getTableView().getTableView().getItemAtPosition(index);
				TableViewRowProxy.fillClickEvent(dataCopy, getTableView().getModel(), item);
				data = dataCopy;
			}
		}

		return super.fireEvent(eventName, data);
	}

	@Kroll.method
	public void updateRow(Object row, Object data, @Kroll.argument(optional = true) KrollDict options)
	{
		TableViewSectionProxy sectionProxy = null;
		int rowIndex = -1;
		if (row instanceof Number) {
			RowResult rr = new RowResult();
			rowIndex = ((Number) row).intValue();
			locateIndex(rowIndex, rr);
			sectionProxy = rr.section;
			rowIndex = rr.rowIndexInSection;
		} else if (row instanceof TableViewRowProxy) {
			ArrayList<TableViewSectionProxy> sections = getSectionsArray();
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
		TableViewRowProxy rowProxy = rowProxyFor(data);
		if (rowProxy == null) {
			Log.e(TAG, "Unable to update row. Invalid type for row: " + data);
			return;
		}
		if (sectionProxy != null) {
			sectionProxy.updateRowAt(rowIndex, rowProxy);
			getTableView().setModelDirty();
			updateView();
		} else {
			Log.e(TAG, "Unable to update row. Non-existent row: " + row);
		}
	}

	@Kroll.method
	public void updateSection(Number index, Object data, @Kroll.argument(optional = true) KrollDict options)
	{
		int sectionIndex = index.intValue();
		TableViewSectionProxy sectionProxy = sectionProxyFor(data);

		if (sectionProxy == null) {
			Log.e(TAG, "Unable to update section. Invalid type for section: " + data);
			return;
		}
		try {
			ArrayList<TableViewSectionProxy> currentSections = getSectionsArray();
			currentSections.set(sectionIndex, sectionProxy);
			getTableView().setModelDirty();
			updateView();
		} catch (IndexOutOfBoundsException e) {
			Log.e(TAG, "Unable to update section. Index out of range. Non-existent section at " + index);
		}
	}

	// options argument exists in order to maintain parity with iOS, do not remove
	@Kroll.method
	public void appendRow(Object rows, @Kroll.argument(optional = true) KrollDict options)
	{
		if (TiApplication.isUIThread()) {
			handleAppendRow(rows);

			return;
		}

		TiMessenger.sendBlockingMainMessage(getMainHandler().obtainMessage(MSG_APPEND_ROW), rows);
	}
	
	private void handleAppendRow(Object rows)
	{
		Object[] rowList = null;

		if (rows instanceof Object[]) {
			rowList = (Object[]) rows;
		} else {
			rowList = new Object[] { rows };
		}

		ArrayList<TableViewSectionProxy> sections = getSectionsArray();
		if (sections.size() == 0) {
			processData(rowList);
		} else {
			for (int i = 0; i < rowList.length; i++) {
				TableViewRowProxy rowProxy = rowProxyFor(rowList[i]);

				TableViewSectionProxy lastSection = sections.get(sections.size() - 1);
				TableViewSectionProxy addedToSection = addRowToSection(rowProxy, lastSection);
				if (lastSection == null || !lastSection.equals(addedToSection)) {
					sections.add(addedToSection);
				}
				rowProxy.setProperty(TiC.PROPERTY_SECTION, addedToSection);
				rowProxy.setProperty(TiC.PROPERTY_PARENT, addedToSection);
			}
		}

		getTableView().setModelDirty();
		updateView();
	}

	@Kroll.method
	public void appendSection(Object sections, @Kroll.argument(optional = true) KrollDict options)
	{
		if (TiApplication.isUIThread()) {
			handleAppendSection(sections);
			return;
		}

		TiMessenger.sendBlockingMainMessage(getMainHandler().obtainMessage(MSG_APPEND_SECTION), sections);
	}

	private void handleAppendSection(Object sections)
	{
		Object[] sectionList = null;

		if (sections instanceof Object[]) {
			sectionList = (Object[]) sections;
		} else {
			sectionList = new Object[] { sections };
		}

		ArrayList<TableViewSectionProxy> currentSections = getSectionsArray();
		for (int i = 0; i < sectionList.length; i++) {
			TableViewSectionProxy sectionProxy = sectionProxyFor(sectionList[i]);
			if (sectionProxy != null) {
				currentSections.add(sectionProxy);
			}
		}

		getTableView().setModelDirty();
		updateView();
	}

	@Kroll.method
	public void deleteRow(int index, @Kroll.argument(optional = true) KrollDict options)
	{
		if (TiApplication.isUIThread()) {
			handleDeleteRow(index);
			return;
		}

		Object asyncResult = TiMessenger.sendBlockingMainMessage(getMainHandler().obtainMessage(MSG_DELETE_ROW), index);

		if (asyncResult instanceof IllegalStateException) {
			throw (IllegalStateException) asyncResult;
		}
	}

	private void handleDeleteRow(int index) throws IllegalStateException
	{
		RowResult rr = new RowResult();
		if (locateIndex(index, rr)) {
			rr.section.removeRowAt(rr.rowIndexInSection);
			getTableView().setModelDirty();
			updateView();
		} else {
			throw new IllegalStateException("Index out of range. Non-existent row at " + index);
		}
	}

	@Kroll.method
	public void deleteSection(int index, @Kroll.argument(optional = true) KrollDict options)
	{
		if (TiApplication.isUIThread()) {
			handleDeleteSection(index);
			return;
		}

		Object asyncResult = TiMessenger.sendBlockingMainMessage(getMainHandler().obtainMessage(MSG_DELETE_SECTION), index);

		if (asyncResult instanceof IllegalStateException) {
			Log.e(TAG, ((IllegalStateException)asyncResult).getMessage());
		}
	}

	private void handleDeleteSection(int index) throws IllegalStateException
	{
		ArrayList<TableViewSectionProxy> currentSections = getSectionsArray();
		try {
			currentSections.remove(index);
			getTableView().setModelDirty();
			updateView();
		} catch (IndexOutOfBoundsException e) {
			throw new IllegalStateException("Unable to delete section. Index out of range. Non-existent section at " + index);
		}
	}

	@Kroll.method
	public int getIndexByName(String name)
	{
		int index = -1;
		int idx = 0;
		if (name != null) {
			for (TableViewSectionProxy section : getSections()) {
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
	public void insertRowBefore(int index, Object data, @Kroll.argument(optional = true) KrollDict options)
	{
		if (TiApplication.isUIThread()) {
			handleInsertRowBefore(index, data);
			return;
		}

		Object asyncResult = TiMessenger.sendBlockingMainMessage(
			getMainHandler().obtainMessage(MSG_INSERT_ROW, INSERT_ROW_BEFORE, index), data);

		if (asyncResult instanceof IllegalStateException) {
			throw (IllegalStateException) asyncResult;
		}
	}

	private void handleInsertRowBefore(int index, Object data) throws IllegalStateException
	{
		if (getSectionsArray().size() > 0) {
			if (index < 0) {
				index = 0;
			}

			RowResult rr = new RowResult();
			if (locateIndex(index, rr)) {
				TableViewRowProxy rowProxy = rowProxyFor(data);
				rr.section.insertRowAt(rr.rowIndexInSection, rowProxy);
			} else {
				throw new IllegalStateException("Index out of range. Non-existent row at " + index);
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
	public void insertSectionBefore(int index, Object data, @Kroll.argument(optional = true) KrollDict options)
	{
		if (TiApplication.isUIThread()) {
			handleInsertRowBefore(index, data);
			return;
		}

		Object asyncResult = TiMessenger.sendBlockingMainMessage(
			getMainHandler().obtainMessage(MSG_INSERT_SECTION, INSERT_SECTION_BEFORE, index), data);

		if (asyncResult instanceof IllegalStateException) {
			Log.e(TAG, ((IllegalStateException)asyncResult).getMessage());
		}
	}

	private void handleInsertSectionBefore(int index, Object data) throws IllegalStateException
	{
		TableViewSectionProxy sectionProxy = sectionProxyFor(data);
		if (sectionProxy == null) {
			throw new IllegalStateException("Unable to insert section. Invalid type for section: " + data);
		}

		try {
			ArrayList<TableViewSectionProxy> currentSections = getSectionsArray();
			currentSections.add(index, sectionProxy);
			getTableView().setModelDirty();
			updateView();
		} catch (IndexOutOfBoundsException e) {
			throw new IllegalStateException("Unable to insert section. Index out of range. Non-existent row at " + index);
		}
	}

	@Kroll.method
	public void insertRowAfter(int index, Object data, @Kroll.argument(optional = true) KrollDict options)
	{
		if (TiApplication.isUIThread()) {
			handleInsertRowAfter(index, data);
			return;
		}

		Object asyncResult = TiMessenger.sendBlockingMainMessage(
			getMainHandler().obtainMessage(MSG_INSERT_ROW, INSERT_ROW_AFTER, index), data);

		if (asyncResult instanceof IllegalStateException) {
			throw (IllegalStateException) asyncResult;
		}
	}

	private void handleInsertRowAfter(int index, Object data) throws IllegalStateException
	{
		RowResult rr = new RowResult();
		if (locateIndex(index, rr)) {
			// TODO check for section
			TableViewRowProxy rowProxy = rowProxyFor(data);
			rr.section.insertRowAt(rr.rowIndexInSection + 1, rowProxy);
			getTableView().setModelDirty();
			updateView();
		} else {
			throw new IllegalStateException("Index out of range. Non-existent row at " + index);
		}
	}

	@Kroll.method
	public void insertSectionAfter(int index, Object data, @Kroll.argument(optional = true) KrollDict options)
	{
		if (TiApplication.isUIThread()) {
			handleInsertSectionAfter(index, data);
			return;
		}

		Object asyncResult = TiMessenger.sendBlockingMainMessage(
			getMainHandler().obtainMessage(MSG_INSERT_SECTION, INSERT_SECTION_AFTER, index), data);

		if (asyncResult instanceof IllegalStateException) {
			Log.e(TAG, ((IllegalStateException)asyncResult).getMessage());
		}
	}

	private void handleInsertSectionAfter(int index, Object data) throws IllegalStateException
	{
		TableViewSectionProxy sectionProxy = sectionProxyFor(data);
		if (sectionProxy == null) {
			throw new IllegalStateException("Unable to insert section. Invalid type for section: " + data);
		}

		if (index < 0) {
			throw new IllegalStateException("Unable to insert section. Index out of range. Non-existent row at " + index);
		}

		try {
			ArrayList<TableViewSectionProxy> currentSections = getSectionsArray();
			currentSections.add(index+1, sectionProxy);
			getTableView().setModelDirty();
			updateView();
		} catch (IndexOutOfBoundsException e) {
			throw new IllegalStateException("Unable to insert section. Index out of range. Non-existent row at " + index);
		}
	}

	@Kroll.getProperty @Kroll.method
	public TableViewSectionProxy[] getSections()
	{
		ArrayList<TableViewSectionProxy> sections = getSectionsArray();
		return sections.toArray(new TableViewSectionProxy[sections.size()]);
	}

	@Kroll.getProperty @Kroll.method
	public int getSectionCount()
	{
		ArrayList<TableViewSectionProxy> sections = getSectionsArray();
		return sections.size();
	}

	public ArrayList<TableViewSectionProxy> getSectionsArray()
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
	 * to the currentSection. If it does carry section information (i.e., a header),
	 * that section will be created and the row added to it. Either way,
	 * whichever section the row gets added to will be returned.
	 */
	private TableViewSectionProxy addRowToSection(TableViewRowProxy row, TableViewSectionProxy currentSection)
	{
		TableViewSectionProxy addedToSection = null;
		if (currentSection == null || row.hasProperty(TiC.PROPERTY_HEADER)) {
			addedToSection = new TableViewSectionProxy();
		} else {
			addedToSection = currentSection;
		}
		if (row.hasProperty(TiC.PROPERTY_HEADER)) {
			addedToSection.setProperty(TiC.PROPERTY_HEADER_TITLE, row.getProperty(TiC.PROPERTY_HEADER));
		}
		if (row.hasProperty(TiC.PROPERTY_FOOTER)) {
			addedToSection.setProperty(TiC.PROPERTY_FOOTER_TITLE, row.getProperty(TiC.PROPERTY_FOOTER));
		}
		addedToSection.add(row);
		return addedToSection;
	}

	public void processData(Object[] data)
	{
		ArrayList<TableViewSectionProxy> sections = getSectionsArray();
		sections.clear();

		TableViewSectionProxy currentSection = null;
		if (hasProperty(TiC.PROPERTY_HEADER_TITLE)) {
			currentSection = new TableViewSectionProxy();
			currentSection.setActivity(getActivity());
			sections.add(currentSection);
			currentSection.setProperty(TiC.PROPERTY_HEADER_TITLE, getProperty(TiC.PROPERTY_HEADER_TITLE));
		}
		if (hasProperty(TiC.PROPERTY_FOOTER_TITLE)) {
			if (currentSection == null) {
				currentSection = new TableViewSectionProxy();
				currentSection.setActivity(getActivity());
				sections.add(currentSection);
			}
			currentSection.setProperty(TiC.PROPERTY_FOOTER_TITLE, getProperty(TiC.PROPERTY_FOOTER_TITLE));
		}

		for (int i = 0; i < data.length; i++) {
			Object o = data[i];
			if (o instanceof HashMap || o instanceof TableViewRowProxy) {
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
	public void setData(Object[] args)
	{
		Object[] data = args;
		if (args != null && args.length > 0 && args[0] instanceof Object[]) {
			data = (Object[]) args[0];
		}
		if (TiApplication.isUIThread()) {
			handleSetData(data);

		} else {
			TiMessenger.sendBlockingMainMessage(getMainHandler().obtainMessage(MSG_SET_DATA), data);
		}
	}

	private void handleSetData(Object[] data)
	{
		if (data != null) {
			processData(data);
			getTableView().setModelDirty();
			updateView();
		}
	}

	@Kroll.getProperty @Kroll.method
	public Object[] getData()
	{
		ArrayList<TableViewSectionProxy> sections = getSectionsArray();
		if (sections != null) {
			return sections.toArray();
		}

		return new Object[0];
	}

	private TableViewRowProxy rowProxyFor(Object row)
	{
		TableViewRowProxy rowProxy = null;
		if (row instanceof TableViewRowProxy) {
			rowProxy = (TableViewRowProxy) row;
			rowProxy.setProperty(TiC.PROPERTY_ROW_DATA, new KrollDict(rowProxy.getProperties()));
			
		} else {
			KrollDict rowDict = null;
			if (row instanceof KrollDict) {
				rowDict = (KrollDict) row;

			} else if (row instanceof HashMap) {
				rowDict = new KrollDict((HashMap) row);
			}

			if (rowDict != null) {
				rowProxy = new TableViewRowProxy();
				rowProxy.setCreationUrl(creationUrl.getNormalizedUrl());
				rowProxy.handleCreationDict(rowDict);
				rowProxy.setProperty(TiC.PROPERTY_CLASS_NAME, CLASSNAME_NORMAL);
				rowProxy.setCreationProperties(rowDict);
				rowProxy.setProperty(TiC.PROPERTY_ROW_DATA, row);
				rowProxy.setActivity(getActivity());
			}
		}

		if (rowProxy == null) {
			Log.e(TAG,
				"Unable to create table view row proxy for object, likely an error in the type of the object passed in...");
			return null;
		}

		rowProxy.setParent(this);
		return rowProxy;
	}

	private TableViewSectionProxy sectionProxyFor(Object section)
	{
		TableViewSectionProxy sectionProxy = null;
		if (section instanceof TableViewSectionProxy) {
			sectionProxy = (TableViewSectionProxy)section;
			sectionProxy.setActivity(getActivity());
		} else {
			KrollDict sectionDict = null;
			if (section instanceof KrollDict) {
				sectionDict = (KrollDict) section;
			} else if (section instanceof HashMap) {
				sectionDict = new KrollDict((HashMap) section);
			}
			if (sectionDict != null) {
				sectionProxy = new TableViewSectionProxy();
				if (sectionDict.containsKey(TiC.PROPERTY_HEADER_TITLE)){
					sectionProxy.setProperty(TiC.PROPERTY_HEADER_TITLE, sectionDict.get(TiC.PROPERTY_HEADER_TITLE));
				}
				if (sectionDict.containsKey(TiC.PROPERTY_FOOTER_TITLE)){
					sectionProxy.setProperty(TiC.PROPERTY_FOOTER_TITLE, sectionDict.get(TiC.PROPERTY_FOOTER_TITLE));
				}
				if (sectionDict.containsKey(TiC.PROPERTY_HEADER_VIEW)){
					sectionProxy.setProperty(TiC.PROPERTY_HEADER_VIEW, sectionDict.get(TiC.PROPERTY_HEADER_VIEW));
				}
				if (sectionDict.containsKey(TiC.PROPERTY_FOOTER_VIEW)){
					sectionProxy.setProperty(TiC.PROPERTY_FOOTER_VIEW, sectionDict.get(TiC.PROPERTY_FOOTER_VIEW));
				}
				sectionProxy.setActivity(getActivity());
			}
		}
		if (sectionProxy == null) {
			Log.e(TAG,
				"Unable to create table view section proxy for object, likely an error in the type of the object passed in...");
			return null;
		}
		sectionProxy.setParent(this);
		return sectionProxy;
	}

	private boolean locateIndex(int index, RowResult rowResult)
	{
		boolean found = false;
		int rowCount = 0;
		int sectionIndex = 0;

		if (index < 0) {
			return found;
		}

		for (TableViewSectionProxy section : getSections()) {
			int sectionRowCount = (int) section.getRowCount();
			if (sectionRowCount + rowCount > index) {
				rowResult.section = section;
				rowResult.sectionIndex = sectionIndex;
				TableViewRowProxy[] rowsInSection = section.getRows();
				int rowIndexInSection = index - rowCount;
				if (rowIndexInSection > 0 && rowIndexInSection < rowsInSection.length) {
					rowResult.row = rowsInSection[rowIndexInSection];
					rowResult.rowIndexInSection = rowIndexInSection;
					found = true;
					break;
				}
			} else {
				rowCount += sectionRowCount;
			}

			sectionIndex += 1;
		}

		return found;
	}

	public void updateView()
	{
		if (TiApplication.isUIThread()) {
			getTableView().updateView();
			return;
		}

		TiMessenger.sendBlockingMainMessage(getMainHandler().obtainMessage(MSG_UPDATE_VIEW));
	}

	@Kroll.method
	public void scrollToIndex(int index)
	{
		Message message = getMainHandler().obtainMessage(MSG_SCROLL_TO_INDEX);
		// Message msg = getUIHandler().obtainMessage(MSG_SCROLL_TO_INDEX);
		message.arg1 = index;
		message.sendToTarget();
	}
	
	@Kroll.method
	public void selectRow(int row_id)
	{
		Message message = getMainHandler().obtainMessage(MSG_SELECT_ROW);
		message.arg1 = row_id;
		message.sendToTarget();
	}
    

	@Kroll.method
	public void scrollToTop(int index)
	{
		Message message = getMainHandler().obtainMessage(MSG_SCROLL_TO_TOP);
		// Message msg = getUIHandler().obtainMessage(MSG_SCROLL_TO_TOP);
		message.arg1 = index;
		message.sendToTarget();
	}

	@Override
	public boolean handleMessage(Message msg)
	{
		if (msg.what == MSG_UPDATE_VIEW) {
			getTableView().updateView();
			((AsyncResult) msg.obj).setResult(null);
			return true;
		} else if (msg.what == MSG_SCROLL_TO_INDEX) {
			getTableView().scrollToIndex(msg.arg1);
			return true;
		} else if (msg.what == MSG_SET_DATA) {
			AsyncResult result = (AsyncResult) msg.obj;
			Object[] data = (Object[]) result.getArg();
			handleSetData(data);
			result.setResult(null);
			return true;
		} else if (msg.what == MSG_INSERT_ROW) {
			AsyncResult result = (AsyncResult) msg.obj;
			try {
				if (msg.arg1 == INSERT_ROW_AFTER) {
					handleInsertRowAfter(msg.arg2, result.getArg());

				} else {
					handleInsertRowBefore(msg.arg2, result.getArg());
				}
				result.setResult(null);

			} catch (IllegalStateException e) {
				result.setResult(e);
			}
			return true;
		} else if (msg.what == MSG_APPEND_ROW) {
			AsyncResult result = (AsyncResult) msg.obj;
			handleAppendRow(result.getArg());
			result.setResult(null);
			return true;
		} else if (msg.what == MSG_DELETE_ROW) {
			AsyncResult result = (AsyncResult) msg.obj;
			try {
				handleDeleteRow((Integer) result.getArg());
				result.setResult(null);
			} catch (IllegalStateException e) {
				result.setResult(e);
			}
			return true;
		} else if (msg.what == MSG_INSERT_SECTION) {
			AsyncResult result = (AsyncResult) msg.obj;
			try {
				if (msg.arg1 == INSERT_SECTION_AFTER) {
					handleInsertSectionAfter(msg.arg2, result.getArg());

				} else {
					handleInsertSectionBefore(msg.arg2, result.getArg());
				}
				result.setResult(null);

			} catch (IllegalStateException e) {
				result.setResult(e);
			}
			return true;
		} else if (msg.what == MSG_APPEND_SECTION) {
			AsyncResult result = (AsyncResult) msg.obj;
			handleAppendSection(result.getArg());
			result.setResult(null);
			return true;
		} else if (msg.what == MSG_DELETE_SECTION) {
			AsyncResult result = (AsyncResult) msg.obj;
			try {
				handleDeleteSection((Integer) result.getArg());
				result.setResult(null);
			} catch (IllegalStateException e) {
				result.setResult(e);
			}
			return true;
		} else if (msg.what == MSG_SCROLL_TO_TOP) {
			getTableView().scrollToTop(msg.arg1);
			return true;
		} else if (msg.what == MSG_SELECT_ROW) {
			getTableView().selectRow(msg.arg1);
			return true;
		}


		return super.handleMessage(msg);
	}

	// labels only send out click events when they are explicitly told to do so.
	// we need to tell each label child to enable clicks when a click listener is added
	@Override
	public void eventListenerAdded(String eventName, int count, KrollProxy proxy)
	{
		super.eventListenerAdded(eventName, count, proxy);
		if (eventName.equals(TiC.EVENT_CLICK) && proxy == this) {
			for (TableViewSectionProxy section : getSections()) {
				for (TableViewRowProxy row : section.getRows()) {
					row.setLabelsClickable(true);
				}
			}
		}
	}

	@Override
	public void eventListenerRemoved(String eventName, int count, KrollProxy proxy)
	{
		super.eventListenerRemoved(eventName, count, proxy);
		if (eventName.equals(TiC.EVENT_CLICK) && count == 0 && proxy == this) {
			for (TableViewSectionProxy section : getSections()) {
				for (TableViewRowProxy row : section.getRows()) {
					row.setLabelsClickable(false);
				}
			}
		}
	}
}

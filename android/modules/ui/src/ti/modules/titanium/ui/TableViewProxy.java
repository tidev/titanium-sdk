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
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.widget.TiUITableView;
import android.app.Activity;

public class TableViewProxy extends TiViewProxy
{
    private static final String LCAT = "TableViewProxyl";
    private static final boolean DBG = TiConfig.LOGD;

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

		Object o = getDynamicValue("data");
		if (o != null) {
			processData((Object[]) o);
		}
	}

	@Override
	public TiUIView createView(Activity activity) {
		return new TiUITableView(this);
	}

	public void updateRow(Object row, TiDict data, TiDict options) {
		// row can be index or proxy
	}

	public void appendRow(Object row, TiDict options)
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
		}
	}

	public void deleteRow(int index, TiDict options)
	{
		RowResult rr = new RowResult();
		if (locateIndex(index, rr)) {
			rr.section.removeRowAt(rr.rowIndexInSection);
		} else {
        	throw new IllegalStateException("Index out of range. Non-existant row at " + index);
		}
	}

	public int getIndexByName(String name) {
        int index = -1;
        int idx = 0;
        if (name != null) {
        	for(TableViewSectionProxy section : getSections()) {
        		for (TableViewRowProxy row : section.getRows()) {
        			String rname = TiConvert.toString(row.getDynamicValue("name"));
    				if(rname != null && name.equals(rname)) {
    					index = idx;
    					break;
    				}
        		}
        		if (index > -1) {
        			break;
        		}
        		idx++;
        	}
        }
        return index;
	}

	public void insertRowBefore(int index, Object data, TiDict options)
	{
        if (getSections().size() > 0) {
            if (index < 0) {
                index = 0;
            }

            RowResult rr = new RowResult();
            if (locateIndex(index, rr)) {
            	TableViewRowProxy rowProxy = rowProxyFor(data);
             	rr.section.insertRowAt(rr.rowIndexInSection, rowProxy);
            } else {
            	throw new IllegalStateException("Index out of range. Non-existant row at " + index);
            }
        } else {
        	// Add first row.
            Object[] args = { rowProxyFor(data) };
            processData(args);
        }
	}

	public void insertRowAfter(int index, Object data, TiDict options)
	{
        RowResult rr = new RowResult();
        if (locateIndex(index, rr)) {
        	// TODO check for section
        	TableViewRowProxy rowProxy = rowProxyFor(data);
        	rr.section.insertRowAt(rr.rowIndexInSection + 1, rowProxy);
        } else {
        	throw new IllegalStateException("Index out of range. Non-existant row at " + index);
        }

	}

	public void scrollToIndex(int index, TiDict options) {

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

	public void processData(Object[] data)
	{
		ArrayList<TableViewSectionProxy> sections = getSections();
		sections.clear();

        TableViewSectionProxy currentSection = null;

		for(int i = 0; i < data.length; i++) {
			Object o = data[i];

			if (o instanceof TiDict) {
				TiDict d = (TiDict) o;
	            Object[] args = { d };
	            TableViewRowProxy rowProxy = new TableViewRowProxy(getTiContext(), args);
	            rowProxy.setDynamicValue("className", CLASSNAME_NORMAL);
	            rowProxy.setDynamicValue("rowData", data);

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
			}
		}
	}

	public void setData(Object[] data, TiDict options) {
		processData(data);
	}
	public Object getData() {
		return getSections();
	}

	private TableViewRowProxy rowProxyFor(Object row) {
		if (row instanceof TiDict) {
			TiDict d = (TiDict) row;
            Object[] args = { d };
            TableViewRowProxy rowProxy = new TableViewRowProxy(getTiContext(), args);
            rowProxy.setDynamicValue("className", CLASSNAME_NORMAL);
            rowProxy.setDynamicValue("rowData", row);
            return rowProxy;
		}
		return (TableViewRowProxy) row;
	}

    private boolean locateIndex(int index, RowResult rowResult)
    {
    	boolean found = false;
    	int rowCount = 0;
    	int sectionIndex = 0;

    	for(TableViewSectionProxy section : getSections()) {
    		int sectionRowCount = (int) section.getRowCount();
    		if (sectionRowCount + rowCount > index) {
				rowResult.section = section;
				rowResult.sectionIndex = sectionIndex;
				rowResult.row = section.getRows()[index - rowCount];
				rowResult.rowIndexInSection = index - rowCount;
    		} else {
    			rowCount += sectionRowCount;
    		}

    		sectionIndex += 1;
    	}

    	return found;
    }

}

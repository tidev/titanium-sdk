/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget.tableview;

import java.util.ArrayList;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConvert;

import ti.modules.titanium.ui.TableViewRowProxy;
import ti.modules.titanium.ui.TableViewSectionProxy;

public class TableViewModel
{
    private static final String LCAT = "TableViewModel";
    private static final boolean DUMP = false;

    public static final String CLASSNAME_DEFAULT = "__default__";
    public static final String CLASSNAME_HEADER = "__header__";
    public static final String CLASSNAME_NORMAL = "__normal__";

    // Flat view

    public class Item {
        public Item(int index) {
            this.index = index;
        }
        public boolean hasHeader() {
            return headerText != null;
        }

        public int index;
        public int sectionIndex;
        public int indexInSection;
        public String headerText;
        public String name;
        public String className;
        public TiViewProxy proxy;
        public Object rowData;
    }

    private TiContext tiContext;

    private boolean dirty;
    private ArrayList<TableViewSectionProxy> sections; // todo, use later

    private ArrayList<Item> model;
    private ArrayList<Item> viewModel;

    // The unstructured set of data. Modifier operations are treated as edits to this
    // and the section structure.

    public TableViewModel(TiContext tiContext) {
        this.tiContext = tiContext;

        model = new ArrayList<Item>();
        viewModel = new ArrayList<Item>();
        dirty = true;
    }

    public int getRowCount() {
        return model.size();
    }

    public int getIndexByName(String name) {
        int index = -1;

        if (name != null) {
            for(Item item : model) {
                if (item.name != null) {
                    if (name.equals(item.name)) {
                        index = item.index;
                        break;
                    }
                }
            }
        }

        if (DUMP) {
            Log.e(LCAT, "Index of Name: " + name + " is " + index);
        }
        return index;
    }

    private Item itemForObject(int index, Object data)
    {
        Item newItem = new Item(index);
        TableViewRowProxy rowProxy = null;

        if (data instanceof TiDict) {
            Object[] args = { data };
            rowProxy = new TableViewRowProxy(tiContext, args);
            newItem.proxy = rowProxy;
            newItem.rowData = data;
            newItem.className = CLASSNAME_NORMAL;
        } else if (data instanceof TableViewRowProxy) {
            rowProxy = (TableViewRowProxy) data;
            newItem.proxy = rowProxy;
            newItem.rowData = rowProxy;
            String className = TiConvert.toString(rowProxy.getDynamicValue("className"));
            if (className == null) {
            	className = CLASSNAME_DEFAULT;
            }
            newItem.className = className;
        } else {
        	throw new IllegalStateException("Un-implemented type: " + data.getClass().getSimpleName());
        }

        return newItem;
    }

    public void insertItemBefore(int index, Object data)
    {
        if (model.size() > 0) {
            if (index < 0) {
                index = 0;
            }

            Item item = model.get(index);

            Item newItem = itemForObject(index, data);
            TiDict props = newItem.proxy.getDynamicProperties();

            if (props.containsKey("header")) {
                newItem.headerText = props.getString("header");
            }
            if (props.containsKey("name")) {
                newItem.name = props.getString("name");
            }
            model.add(newItem.index, newItem);

            updateIndexes(index+1);

            if (newItem.hasHeader()) {
                newItem.sectionIndex = item.sectionIndex;
                newItem.indexInSection = 0;
                updateSectionData(index + 1, newItem.sectionIndex);
            } else {
                if (item.hasHeader()) {
                    newItem.headerText = item.headerText;
                    item.headerText = null;
                    newItem.sectionIndex = item.sectionIndex;
                    newItem.indexInSection = 0;
                    updateSectionData(index + 1, newItem.sectionIndex);
                } else {
                    newItem.sectionIndex = item.sectionIndex;
                    updateIndexInSection(index, item.indexInSection);
                }
            }
        } else {
            insertFirstRow(data);
        }

        dirty = true;

        if (DUMP) {
            Log.w(LCAT, "==== After insertItemBefore");
            dumpModel();
        }
    }

    public void insertItemAfter(int index, Object data)
    {
        if (model.size() > 0) {
            if (index > model.size()) {
                index = model.size() - 1;
            }

            Item item = model.get(index);

            Item newItem = itemForObject(index+1, data);
            TiDict props = newItem.proxy.getDynamicProperties();
            if (props.containsKey("header")) {
                newItem.headerText = props.getString("header");
            }
            if (props.containsKey("name")) {
                newItem.name = props.getString("name");
            }

            model.add(newItem.index, newItem);

            updateIndexes(newItem.index);

            if (newItem.hasHeader()) {
                newItem.sectionIndex = item.sectionIndex + 1;
                newItem.indexInSection = 0;
                updateSectionData(newItem.index, newItem.sectionIndex);
            } else {
                newItem.sectionIndex = item.sectionIndex;
                updateIndexInSection(newItem.index, item.indexInSection + 1);
            }
        } else {
            insertFirstRow(data);
        }
        dirty = true;

        if (DUMP) {
            Log.w(LCAT, "==== After insertItemAfter");
            dumpModel();
        }
    }

    public void deleteItem(int index)
    {
        if (index >= 0 && index < model.size()) {
            Item oldItem = model.get(index);
            model.remove(index);
            updateIndexes(index);
            if (oldItem.hasHeader()) {
                Item item = model.get(index);
                if (item.hasHeader()) {
                    updateSectionData(index, oldItem.sectionIndex-1); // gets incremented on detection.
                } else {
                    item.headerText = oldItem.headerText;
                    item.indexInSection = oldItem.indexInSection;
                    updateIndexInSection(index + 1, item.indexInSection + 1);
                }
            } else {
                updateIndexInSection(index, oldItem.indexInSection);
            }
            dirty = true;
        } else {
            Log.w(LCAT, "Attempt to delete non-existant row with index " + index);
        }
        if (DUMP) {
            Log.w(LCAT, "==== After deleteItem");
            dumpModel();
        }
    }

    public void updateItem(int index, Object data)
    {
        Item item = model.get(index);
        if (data instanceof TiDict) {
            Object[] args = { data };
            item.proxy = new TableViewRowProxy(tiContext, args);
            item.rowData = data;
        } else if (data instanceof TableViewRowProxy) {
            item.proxy = (TableViewRowProxy) data;
            item.rowData = data;
        }
        TiDict props = item.proxy.getDynamicProperties();

        if (props.containsKey("header")) {
            if (item.hasHeader()) {
                item.headerText = props.getString("header");
            } else {
                // We need to insert a new section.
                item.headerText = props.getString("header");
                item.sectionIndex++;
                item.indexInSection = 0;

                updateSectionData(index+1, item.sectionIndex);
            }
        }
        dirty = true;
        if (DUMP) {
            Log.w(LCAT, "==== After updateItem");
            dumpModel();
        }
    }

    public void setData(Object[] rows) {
        if (model != null) {
            model.clear();
        }
        dirty = true;
        int sectionCounter = 0;
        int sectionRowCounter = 0;

        if (rows != null) {
            for(int i = 0; i < rows.length; i++) {
                Item item = itemForObject(i, rows[i]);
                TiDict props = item.proxy.getDynamicProperties();
                if (props.containsKey("name")) {
                    item.name = props.getString("name");
                }

                if (props.containsKey("header")) {
                    if (i > 0) {
                        sectionCounter++;
                        sectionRowCounter = 0;
                    }
                    item.headerText = props.getString("header");
                }

                item.sectionIndex = sectionCounter;
                item.indexInSection = sectionRowCounter;

                model.add(item);
                sectionRowCounter++;
            }
        }
        if (DUMP) {
            Log.w(LCAT, "==== After setData");
            dumpModel();
        }
    }

    public ArrayList<Item> getViewModel() {
        if (dirty) {
            viewModel = new ArrayList<Item>(model.size());
            TiDict o = null;
            for (Item item : model) {
//                if (item.hasHeader()) {
//                    o = item.rowProxy.getDynamicProperties();
//                    o.put("header", item.headerText);
//                    o.put("isDisplayHeader", true);
//                    viewModel.add(o);
//                }
            	viewModel.add(item);
//                o = item.proxy.getDynamicProperties();
//                o.put("section", item.sectionIndex);
//                o.put("sectionIndex", item.indexInSection);
//                o.put("index", item.index);
//                o.put("isDisplayHeader", false);
//                viewModel.add(o);
            }
            dirty = false;
        }

        return viewModel;
    }

    public int getViewIndex(int index) {
        int position = -1;
        // the View index can be larger than model index if there are headers.
        if (viewModel != null && index <= viewModel.size()) {
            for(int i = 0; i < viewModel.size(); i++) {
                Item item = viewModel.get(i);
                if (index == item.index) {
                    position = i;
                    break;
                }
            }
        }

        return position;
    }

    public int getRowHeight(int position, int defaultHeight) {
        int rowHeight = defaultHeight;

        Item item = viewModel.get(position);
        Object rh = item.proxy.getDynamicValue("rowHeight");
        if (rh != null) {
        	rowHeight = TiConvert.toInt(rh);
        }

        return rowHeight;
    }

    private void insertFirstRow(Object data)
    {
        Item newItem = itemForObject(0, data);
//        TiDict props = newItem.rowProxy.getDynamicProperties();

        // TODO fix
//        if (props.containsKey("header")) {
//            newItem.headerText = props.getString("header");
//        }
//        if (props.containsKey("name")) {
//            newItem.name = props.getString("name");
//        }
        newItem.sectionIndex = 0;
        newItem.indexInSection = 0;
        newItem.index = 0;
        model.add(newItem.index, newItem);
    }

    private void updateIndexes(int start) {
        for(int i = start; i < model.size(); i++) {
            model.get(i).index = i;
        }

    }

    private void updateIndexInSection(int start, int sectionRowCounter) {
        for(int i = start; i < model.size(); i++) {
            Item itemInSection = model.get(i);
            if (itemInSection.hasHeader()) {
                break;
            }
            itemInSection.indexInSection = sectionRowCounter++;
        }
    }

    private void updateSectionData(int start, int section) {
        int sectionRowCounter = 0;
        if (!model.get(start).hasHeader()) {
            sectionRowCounter = 1;
        }
        for(int i = start; i < model.size(); i++) {
            Item item = model.get(i);
            if (item.hasHeader()) {
                section++;
                sectionRowCounter = 0;
            }
            item.sectionIndex = section;
            item.indexInSection = sectionRowCounter;
            sectionRowCounter++;
        }
    }

    public void dumpModel() {
        Log.i(LCAT, "");
        for (int i = 0; i < model.size(); i++) {
            Item item = model.get(i);
            Log.i(LCAT, i + ": index: " +  item.index + " s:" + item.sectionIndex + " iis: " +
                    item.indexInSection +
                    " n: " + item.name + " h: " + item.headerText);
        }
    }
}

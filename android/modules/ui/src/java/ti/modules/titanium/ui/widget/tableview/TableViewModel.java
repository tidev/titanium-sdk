/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget.tableview;

import java.util.ArrayList;

import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;

import ti.modules.titanium.ui.TableViewProxy;
import ti.modules.titanium.ui.TableViewRowProxy;
import ti.modules.titanium.ui.TableViewSectionProxy;

public class TableViewModel
{
	private static final String TAG = "TableViewModel";

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
		public String footerText;
		public String name;
		public String className;
		public TiViewProxy proxy;
		public Object rowData;
	}
	private TableViewProxy proxy;

	private boolean dirty;

	private ArrayList<Item> viewModel;

	// The unstructured set of data. Modifier operations are treated as edits to this
	// and the section structure.

	public TableViewModel(TableViewProxy proxy) {
		this.proxy = proxy;

		viewModel = new ArrayList<Item>();
		dirty = true;
	}

	public TableViewModel(TiContext tiContext, TableViewProxy proxy)
	{
		this(proxy);
	}

	public void release() {
		if (viewModel != null) {
			viewModel.clear();
			viewModel = null;
		}
		proxy = null;
	}

	public static String classNameForRow(TableViewRowProxy rowProxy) {
		String className = TiConvert.toString(rowProxy.getProperty(TiC.PROPERTY_CLASS_NAME));
		if (className == null) {
			className = TableViewProxy.CLASSNAME_DEFAULT;
		}
		return className;
	}

	private Item itemForHeader(int index, TableViewSectionProxy proxy, String headerText, String footerText) {
		Item newItem = new Item(index);
		newItem.className = TableViewProxy.CLASSNAME_HEADER;
		if (headerText != null) {
			newItem.headerText = headerText;
		} else if (footerText != null) {
			newItem.footerText = footerText;
		}
		newItem.proxy = proxy;

		return newItem;
	}

	public int getRowCount() {
		if (viewModel == null) {
			return 0;
		}
		return viewModel.size();
	}

	public TableViewSectionProxy getSection(int index)
	{
		return proxy.getSectionsArray().get(index);
	}

	public ArrayList<Item> getViewModel()
	{
		if (dirty) {
			viewModel = new ArrayList<Item>();
			int sectionIndex = 0;
			int indexInSection = 0;
			int index = 0;
			ArrayList<TableViewSectionProxy> sections = proxy.getSectionsArray();
			if (sections != null) {
				for (TableViewSectionProxy section : sections) {
					String headerTitle = TiConvert.toString(section.getProperty(TiC.PROPERTY_HEADER_TITLE));
					if (headerTitle != null) {
						viewModel.add(itemForHeader(index, section, headerTitle, null));
					}
					if (section.hasProperty(TiC.PROPERTY_HEADER_VIEW)) {
						Object headerView = section.getProperty(TiC.PROPERTY_HEADER_VIEW);
						if (headerView instanceof TiViewProxy) {
							Item item = new Item(index);
							item.proxy = (TiViewProxy) headerView;
							item.className = TableViewProxy.CLASSNAME_HEADERVIEW;
							viewModel.add(item);
						} else {
							Log.e(TAG, "HeaderView must be of type TiViewProxy");
						}
					}
					for (TableViewRowProxy row : section.getRows()) {
						Item item = new Item(index);
						item.sectionIndex = sectionIndex;
						item.indexInSection = indexInSection;
						item.proxy = row;
						item.rowData = row.getProperties().get(TiC.PROPERTY_ROW_DATA);
						item.className = classNameForRow(row);

						viewModel.add(item);
						index++;
						indexInSection++;
					}

					String footerTitle = TiConvert.toString(section.getProperty(TiC.PROPERTY_FOOTER_TITLE));
					if (footerTitle != null) {
						viewModel.add(itemForHeader(index, section, null, footerTitle));
					}

					sectionIndex++;
					indexInSection = 0;
				}
				dirty = false;
			}
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
		Object rh = item.proxy.getProperty(TiC.PROPERTY_ROW_HEIGHT);
		if (rh != null) {
			rowHeight = TiConvert.toInt(rh);
		}

		return rowHeight;
	}

	public void setDirty() {
		dirty = true;
	}
}

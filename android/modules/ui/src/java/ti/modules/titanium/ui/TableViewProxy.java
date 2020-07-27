/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2020 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.view.TiUIView;

import android.app.Activity;

import ti.modules.titanium.ui.widget.TiUITableView;
import ti.modules.titanium.ui.widget.tableview.TableViewAdapter;
import ti.modules.titanium.ui.widget.tableview.TiTableView;

@Kroll.proxy(creatableInModule = UIModule.class,
			 propertyAccessors = { TiC.PROPERTY_FILTER_ATTRIBUTE, TiC.PROPERTY_FILTER_ANCHORED,
								   TiC.PROPERTY_FILTER_CASE_INSENSITIVE, TiC.PROPERTY_HEADER_TITLE,
								   TiC.PROPERTY_HEADER_VIEW, TiC.PROPERTY_FOOTER_TITLE, TiC.PROPERTY_FOOTER_VIEW,
								   TiC.PROPERTY_SEARCH, TiC.PROPERTY_SEPARATOR_COLOR, TiC.PROPERTY_SEPARATOR_STYLE,
								   TiC.PROPERTY_OVER_SCROLL_MODE, TiC.PROPERTY_MIN_ROW_HEIGHT,
								   TiC.PROPERTY_HEADER_DIVIDERS_ENABLED, TiC.PROPERTY_FOOTER_DIVIDERS_ENABLED,
								   TiC.PROPERTY_MAX_CLASSNAME, TiC.PROPERTY_REFRESH_CONTROL, TiC.PROPERTY_SCROLLABLE })
public class TableViewProxy extends TiViewProxy
{
	private static final String TAG = "TableViewProxy";

	private List<TiViewProxy> data = new ArrayList<>();

	public TableViewProxy()
	{
		super();

		defaultValues.put(TiC.PROPERTY_OVER_SCROLL_MODE, 0);
		defaultValues.put(TiC.PROPERTY_SCROLLABLE, true);
	}

	@Override
	protected TiUIView handleGetView()
	{
		final TiUIView view = super.handleGetView();

		// Update table if being re-used.
		update();

		return view;
	}

	@Override
	public TiUIView createView(Activity activity)
	{
		return new TiUITableView(this);
	}

	@Override
	public void handleCreationDict(KrollDict dict)
	{
		super.handleCreationDict(dict);

		if (dict.containsKeyAndNotNull(TiC.PROPERTY_SECTION)) {
			setData((Object[]) dict.get(TiC.PROPERTY_SECTION));
		}
		if (dict.containsKeyAndNotNull(TiC.PROPERTY_DATA)) {
			setData((Object[]) dict.get(TiC.PROPERTY_DATA));
		}
	}

	@Override
	public void setActivity(Activity activity)
	{
		super.setActivity(activity);

		for (TiViewProxy view : this.data) {
			view.setActivity(activity);
		}
	}

	@Override
	public void releaseViews()
	{
		super.releaseViews();

		for (TiViewProxy view : this.data) {
			view.releaseViews();
		}
	}

	private TiTableView getTableView()
	{
		final TiUITableView view = (TiUITableView) getOrCreateView();
		if (view != null) {
			return view.getTableView();
		}
		return null;
	}

	private TableViewRowProxy getRowByIndex(int index)
	{
		for (TiViewProxy entry : this.data) {
			if (entry instanceof TableViewRowProxy) {
				final TableViewRowProxy row = (TableViewRowProxy) entry;
				if (row.index == index) {
					return row;
				}
			}
		}
		return null;
	}

	private TableViewSectionProxy getSectionByIndex(int index)
	{
		int i = 0;
		for (TiViewProxy entry : this.data) {
			if (entry instanceof TableViewSectionProxy && i++ == index) {
				final TableViewSectionProxy section = (TableViewSectionProxy) entry;
				return section;
			}
		}
		return null;
	}

	public void update()
	{
		final TiTableView tableView = getTableView();
		if (tableView != null) {
			tableView.update();
		}
	}

	public void updateModels()
	{
		final TiTableView tableView = getTableView();
		if (tableView != null) {
			tableView.updateModels();
		}
	}

	@Override
	public void release()
	{
		if (hasPropertyAndNotNull(TiC.PROPERTY_SEARCH)) {
			final TiViewProxy search = (TiViewProxy) getProperty(TiC.PROPERTY_SEARCH);
			search.releaseViews();
		}

		releaseViews();
		this.data.clear();

		super.release();
	}

	@Kroll.method
	public void appendRow(Object rows, @Kroll.argument(optional = true) KrollDict animation)
	{
		final TiViewProxy[] rowList =
			rows instanceof Object[] ? (TiViewProxy[]) rows : new TiViewProxy[] { (TiViewProxy) rows };

		this.data.addAll(Arrays.asList(rowList));
		update();
	}

	@Kroll.method
	public void appendSection(Object sections, @Kroll.argument(optional = true) KrollDict animation)
	{
		final TiViewProxy[] rowList =
			sections instanceof Object[] ? (TiViewProxy[]) sections : new TiViewProxy[] { (TiViewProxy) sections };

		this.data.addAll(Arrays.asList(rowList));
		update();
	}

	@Kroll.method
	public void deleteRow(Object row, @Kroll.argument(optional = true) KrollDict animation)
	{
		if (row instanceof Integer) {
			final int index = ((Integer) row).intValue();
			this.data.remove(getRowByIndex(index));
		} else if (row instanceof TableViewRowProxy) {
			this.data.remove(row);
		} else {
			Log.e(TAG, "Unable to delete row. Invalid type of row: " + row);
			return;
		}

		update();
	}

	@Kroll.method
	public void deleteSection(int index, @Kroll.argument(optional = true) KrollDict animation)
	{
		this.data.remove(getSectionByIndex(index));
	}

	@Kroll.method
	public void updateRow(int index, TableViewRowProxy row, @Kroll.argument(optional = true) KrollDict animation)
	{
		final int rawIndex = this.data.indexOf(getRowByIndex(index));
		if (rawIndex > -1) {
			this.data.set(rawIndex, row);
			update();
		}
	}

	@Kroll.method
	public void updateSection(int index, TableViewSectionProxy section,
							  @Kroll.argument(optional = true) KrollDict animation)
	{
		final int rawIndex = this.data.indexOf(getSectionByIndex(index));
		if (rawIndex > -1) {
			this.data.set(rawIndex, section);
			update();
		}
	}

	@Kroll.method
	public void insertRowAfter(int index, TableViewRowProxy row, @Kroll.argument(optional = true) KrollDict animation)
	{
		final int rawIndex = this.data.indexOf(getRowByIndex(index));
		if (rawIndex > -1) {
			this.data.add(rawIndex + 1, row);
			update();
		}
	}

	@Kroll.method
	public void insertRowBefore(int index, TableViewRowProxy row)
	{
		final int rawIndex = this.data.indexOf(getRowByIndex(index));
		if (rawIndex > -1) {
			this.data.add(rawIndex, row);
			update();
		}
	}

	@Kroll.method
	public void insertSectionAfter(int index, TableViewSectionProxy section,
								   @Kroll.argument(optional = true) KrollDict animation)
	{
		final int rawIndex = this.data.indexOf(getSectionByIndex(index));
		if (rawIndex > -1) {
			this.data.add(rawIndex + 1, section);
			update();
		}
	}

	@Kroll.method
	public void insertSectionBefore(int index, TableViewSectionProxy section,
									@Kroll.argument(optional = true) KrollDict animation)
	{
		final int rawIndex = this.data.indexOf(getSectionByIndex(index));
		if (rawIndex > -1) {
			this.data.add(rawIndex, section);
			update();
		}
	}

	@Kroll.method
	@Kroll.getProperty
	public TableViewSectionProxy[] getSections()
	{
		final List<TableViewSectionProxy> sections = new ArrayList<>();
		for (final TiViewProxy view : this.data) {
			if (view instanceof TableViewSectionProxy) {
				final TableViewSectionProxy section = (TableViewSectionProxy) view;
				sections.add(section);
			}
		}
		return sections.toArray(new TableViewSectionProxy[sections.size()]);
	}

	@Kroll.method
	@Kroll.getProperty
	public int getSectionCount()
	{
		return getSections().length;
	}

	@Kroll.method
	public void scrollToIndex(int index, @Kroll.argument(optional = true) KrollDict animation)
	{
		getTableView().getRecyclerView().scrollToPosition(index);
	}

	@Kroll.method
	public void scrollToTop(int index, @Kroll.argument(optional = true) KrollDict animation)
	{
		getTableView().getRecyclerView().scrollToPosition(index);
	}

	@Kroll.method
	public void selectRow(int index)
	{
		final TableViewRowProxy row = getRowByIndex(index);
		if (row != null) {
			((TableViewAdapter) getTableView().getRecyclerView().getAdapter()).getTracker().select(row);
		}
	}

	@Kroll.method
	@Kroll.setProperty
	public void setData(Object[] data)
	// clang-format on
	{
		this.data.clear();

		for (Object d : data) {
			if (d instanceof TableViewRowProxy) {
				final TableViewRowProxy row = (TableViewRowProxy) d;
				row.setParent(this);
				this.data.add(row);

			} else if (d instanceof Object[]) {
				setData((Object[]) d);
				return;

			} else if (d instanceof HashMap) {
				final TableViewRowProxy row = new TableViewRowProxy();
				row.setParent(this);
				row.handleCreationDict(new KrollDict((HashMap) d));
				this.data.add(row);

			} else if (d instanceof TableViewSectionProxy) {
				final TableViewSectionProxy section = (TableViewSectionProxy) d;
				section.setParent(this);
				this.data.add(section);
			}
		}

		update();
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public Object[] getData()
	// clang-format on
	{
		final List<TiViewProxy> data = new ArrayList<>();

		// Prefix row for TableView header.
		if (getProperties().containsKeyAndNotNull(TiC.PROPERTY_HEADER_TITLE)
			|| getProperties().containsKeyAndNotNull(TiC.PROPERTY_HEADER_VIEW)) {
			final String headerTitle = getProperties().getString(TiC.PROPERTY_HEADER_TITLE);
			final KrollProxy headerView = (KrollProxy) getProperties().get(TiC.PROPERTY_HEADER_VIEW);
			final TableViewRowProxy row = new TableViewRowProxy();
			final KrollDict dict = new KrollDict();

			// Create empty row with only header defined.
			dict.put(TiC.PROPERTY_HEADER, headerTitle);
			dict.put(TiC.PROPERTY_HEADER_VIEW, headerView);
			row.handleCreationDict(dict);

			data.add(row);
		}

		data.addAll(this.data);

		// Append row for TableView footer.
		if (getProperties().containsKeyAndNotNull(TiC.PROPERTY_FOOTER_TITLE)
			|| getProperties().containsKeyAndNotNull(TiC.PROPERTY_FOOTER_VIEW)) {
			final String footerTitle = getProperties().getString(TiC.PROPERTY_FOOTER_TITLE);
			final KrollProxy footerView = (KrollProxy) getProperties().get(TiC.PROPERTY_FOOTER_VIEW);
			final TableViewRowProxy row = new TableViewRowProxy();
			final KrollDict dict = new KrollDict();

			// Create empty row with only footer defined.
			dict.put(TiC.PROPERTY_FOOTER, footerTitle);
			dict.put(TiC.PROPERTY_FOOTER_VIEW, footerView);
			row.handleCreationDict(dict);
			data.add(row);
		}

		return data.toArray();
	}

	@Override
	public String getApiName()
	{
		return "Ti.UI.TableView";
	}
}

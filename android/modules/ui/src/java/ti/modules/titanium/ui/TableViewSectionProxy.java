/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2020 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import java.util.ArrayList;
import java.util.List;

import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.view.TiUIView;

import android.app.Activity;

@Kroll.proxy(creatableInModule = UIModule.class,
	propertyAccessors = {
		TiC.PROPERTY_HEADER_TITLE,
		TiC.PROPERTY_HEADER_VIEW,
		TiC.PROPERTY_FOOTER_TITLE,
		TiC.PROPERTY_FOOTER_VIEW
})
public class TableViewSectionProxy extends TiViewProxy
{
	private static final String TAG = "TableViewSectionProxy";

	protected List<TableViewRowProxy> rows = new ArrayList<>();

	public TableViewSectionProxy()
	{
		super();
	}

	@Override
	public TiUIView createView(Activity activity)
	{
		return null;
	}

	@Override
	public void setActivity(Activity activity)
	{
		super.setActivity(activity);

		for (TableViewRowProxy row : this.rows) {
			row.setActivity(activity);
		}
	}

	public int getRowIndex(TableViewRowProxy row)
	{
		return this.rows.indexOf(row);
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public TableViewRowProxy[] getRows()
	{
		return this.rows.toArray(new TableViewRowProxy[this.rows.size()]);
	}

	@Kroll.method
	@Kroll.getProperty
	public int getRowCount()
	// clang-format on
	{
		return this.rows.size();
	}

	public TableViewProxy getTableViewProxy()
	{
		TiViewProxy parent = getParent();
		while (!(parent instanceof TableViewProxy) && parent != null) {
			parent = parent.getParent();
		}
		return (TableViewProxy) parent;
	}

	@Kroll.method
	public void add(TableViewRowProxy row)
	{
		if (row != null) {
			this.rows.add(row);
			row.setParent(this);

			final TableViewProxy tableViewProxy = getTableViewProxy();
			if (tableViewProxy != null) {
				tableViewProxy.update();
			}
		}
	}

	@Kroll.method
	public void remove(TableViewRowProxy row)
	{
		if (row != null) {
			this.rows.remove(row);
			if (row.getParent() == this) {
				row.setParent(null);
			}

			final TableViewProxy tableViewProxy = getTableViewProxy();
			if (tableViewProxy != null) {
				tableViewProxy.update();
			}
		}
	}

	@Kroll.method
	public TableViewRowProxy rowAtIndex(int index)
	{
		TableViewRowProxy result = null;

		if (index > -1 && index < rows.size()) {
			result = rows.get(index);
		}
		return result;
	}

	@Override
	public String toString()
	{
		return "[object TableViewSectionProxy]";
	}

	@Override
	public void releaseViews()
	{
		for (TableViewRowProxy row : this.rows) {
			row.releaseViews();
		}

		super.releaseViews();
	}

	@Override
	public void release()
	{
		releaseViews();
		this.rows.clear();

		super.release();
	}

	@Override
	public String getApiName()
	{
		return "Ti.UI.TableViewSection";
	}
}

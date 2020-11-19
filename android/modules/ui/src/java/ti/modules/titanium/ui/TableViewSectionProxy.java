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

	private int filteredRowCount = -1;

	public TableViewSectionProxy()
	{
		super();
	}

	/**
	 * Add row to section at specified index.
	 *
	 * @param index Index to add row to.
	 * @param rowObj Row to add.
	 */
	public void add(int index, Object rowObj)
	{
		TableViewRowProxy row = TableViewProxy.processRow(rowObj);

		if (row != null) {

			if (row.getParent() != null) {

				// Row already exists, clone.
				row = row.clone();
			}

			row.setParent(this);
			this.rows.add(index, row);
		}
	}

	/**
	 * Add row to section.
	 *
	 * @param rowObj Row to add.
	 */
	@Kroll.method
	public void add(Object rowObj)
	{
		// Handle array input.
		if (rowObj instanceof Object[]) {
			for (Object o : (Object[]) rowObj) {
				this.add(o);
			}
			return;
		}

		TableViewRowProxy row = TableViewProxy.processRow(rowObj);

		if (row != null) {

			if (row.getParent() != null) {

				// Row already exists, clone.
				row = row.clone();
			}

			row.setParent(this);
			this.rows.add(row);

			final TableViewProxy tableViewProxy = getTableViewProxy();
			if (tableViewProxy != null) {
				tableViewProxy.update();
			}
		}
	}

	@Override
	public TiUIView createView(Activity activity)
	{
		return null;
	}

	@Override
	public String getApiName()
	{
		return "Ti.UI.TableViewSection";
	}

	/**
	 * Obtain current row count in section.
	 *
	 * @return Integer of row count.
	 */
	@Kroll.method
	@Kroll.getProperty
	public int getRowCount()
	{
		return this.rows.size();
	}

	/**
	 * Get number of filtered rows in section when search query is active.
	 *
	 * @return Integer of filtered row count.
	 */
	public int getFilteredRowCount()
	{
		return this.filteredRowCount;
	}

	/**
	 * Set number of rows that are filtered in section.
	 *
	 * @param filteredRowCount Number of filtered rows.
	 */
	public void setFilteredRowCount(int filteredRowCount)
	{
		this.filteredRowCount = filteredRowCount;
	}

	/**
	 * Get section index for specified row.
	 *
	 * @param row Row to obtain index.
	 * @return Integer of index.
	 */
	public int getRowIndex(TableViewRowProxy row)
	{
		return this.rows.indexOf(row);
	}

	/**
	 * Get array of current rows in section.
	 *
	 * @return TableViewRowProxy array.
	 */
	@Kroll.method
	@Kroll.getProperty
	public TableViewRowProxy[] getRows()
	{
		return this.rows.toArray(new TableViewRowProxy[this.rows.size()]);
	}

	/**
	 * Obtain TableView proxy for section.
	 *
	 * @return TableViewProxy
	 */
	public TableViewProxy getTableViewProxy()
	{
		TiViewProxy parent = getParent();
		while (!(parent instanceof TableViewProxy) && parent != null) {
			parent = parent.getParent();
		}
		return (TableViewProxy) parent;
	}

	/**
	 * Determine if section contains a footer.
	 *
	 * @return Boolean
	 */
	public boolean hasFooter()
	{
		return hasPropertyAndNotNull(TiC.PROPERTY_FOOTER_TITLE)
			|| hasPropertyAndNotNull(TiC.PROPERTY_FOOTER_VIEW);
	}

	/**
	 * Determine if section contains a header.
	 *
	 * @return Boolean
	 */
	public boolean hasHeader()
	{
		return hasPropertyAndNotNull(TiC.PROPERTY_HEADER_TITLE)
			|| hasPropertyAndNotNull(TiC.PROPERTY_HEADER_VIEW);
	}

	@Override
	public void release()
	{
		super.release();

		this.rows.clear();
	}

	/**
	 * Release section views.
	 */
	@Override
	public void releaseViews()
	{
		if (hasPropertyAndNotNull(TiC.PROPERTY_HEADER_VIEW)) {
			final TiViewProxy header = (TiViewProxy) getProperty(TiC.PROPERTY_HEADER_VIEW);
			header.releaseViews();
		}
		if (hasPropertyAndNotNull(TiC.PROPERTY_FOOTER_VIEW)) {
			final TiViewProxy footer = (TiViewProxy) getProperty(TiC.PROPERTY_FOOTER_VIEW);
			footer.releaseViews();
		}

		for (TableViewRowProxy row : this.rows) {
			row.releaseViews();
		}

		super.releaseViews();
	}

	/**
	 * Remove row from section.
	 *
	 * @param row Row to remove.
	 */
	@Kroll.method
	public void remove(TableViewRowProxy row)
	{
		if (row != null && this.rows.contains(row)) {
			this.rows.remove(row);
			row.setParent(null);

			final TableViewProxy tableViewProxy = getTableViewProxy();
			if (tableViewProxy != null) {

				// Notify TableView of update.
				tableViewProxy.update();
			}
		}
	}

	/**
	 * Get row at specified index in section.
	 *
	 * @param index Index of row to obtain.
	 * @return TableViewRowProxy
	 */
	@Kroll.method
	public TableViewRowProxy rowAtIndex(int index)
	{
		TableViewRowProxy result = null;

		if (index > -1 && index < rows.size()) {
			result = rows.get(index);
		}
		return result;
	}

	/**
	 * Set row at specified index.
	 *
	 * @param index Index to set row.
	 * @param rowObj Row to set.
	 */
	public void set(int index, Object rowObj)
	{
		final TableViewRowProxy existingRow = rowAtIndex(index);
		final TableViewRowProxy row = TableViewProxy.processRow(rowObj);

		if (existingRow != null && row != null && existingRow != row) {
			existingRow.setParent(null);
			row.setParent(this);
			this.rows.set(index, row);
		}
	}

	/**
	 * String definition of proxy instance.
	 */
	@Override
	public String toString()
	{
		return "[object TableViewSectionProxy]";
	}
}

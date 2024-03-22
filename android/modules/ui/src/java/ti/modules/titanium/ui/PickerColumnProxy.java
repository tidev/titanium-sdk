/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import android.util.Log;
import java.util.ArrayList;
import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiC;

@Kroll.proxy(creatableInModule = UIModule.class,
	propertyAccessors = {
		TiC.PROPERTY_WIDTH,
})
public class PickerColumnProxy extends KrollProxy implements PickerRowProxy.OnChangedListener
{
	public interface OnChangedListener {
		void onChanged(PickerColumnProxy proxy);
	}

	private static final String TAG = "PickerColumnProxy";
	private final ArrayList<PickerRowProxy> rowList = new ArrayList<>();
	private final ArrayList<PickerColumnProxy.OnChangedListener> listeners = new ArrayList<>();
	private boolean canInvokeListeners = true;

	@Override
	public void release()
	{
		super.release();

		for (PickerRowProxy rowProxy : this.rowList) {
			rowProxy.removeListener(this);
		}
		this.rowList.clear();
	}

	public void addListener(PickerColumnProxy.OnChangedListener listener)
	{
		if ((listener != null) && !this.listeners.contains(listener)) {
			this.listeners.add(listener);
		}
	}

	public void removeListener(PickerColumnProxy.OnChangedListener listener)
	{
		this.listeners.remove(listener);
	}

	@Override
	public void handleCreationDict(KrollDict options)
	{
		super.handleCreationDict(options);

		if (options.containsKey(TiC.PROPERTY_ROWS)) {
			Object value = options.get(TiC.PROPERTY_ROWS);
			if ((value != null) && value.getClass().isArray()) {
				setRows((Object[]) value);
			} else {
				setRows(null);
			}
		}
	}

	@Kroll.setProperty
	public void setFont(KrollDict value)
	{
		setPropertyAndFire(TiC.PROPERTY_FONT, value);
		onColumnChanged();
	}

	@Kroll.method
	public void add(Object value)
	{
		if (value instanceof PickerRowProxy) {
			// Add single row.
			addRow((PickerRowProxy) value);
		} else if ((value != null) && value.getClass().isArray()) {
			// Add array of rows.
			int rowCount = this.rowList.size();
			boolean wasEnabled = this.canInvokeListeners;
			this.canInvokeListeners = true;
			for (Object nextObject : (Object[]) value) {
				add(nextObject);
			}
			this.canInvokeListeners = wasEnabled;
			if (rowCount != this.rowList.size()) {
				onColumnChanged();
			}
		} else {
			Log.w(TAG, "Unable to add row to PickerColumn. Must be of type: Ti.UI.PickerRow");
		}
	}

	@Kroll.method
	public void addRow(PickerRowProxy rowProxy)
	{
		// Validate.
		if (rowProxy == null) {
			return;
		}

		// Do not continue if already added.
		if (this.rowList.contains(rowProxy)) {
			return;
		}

		// Add row to collection.
		this.rowList.add(rowProxy);
		rowProxy.addListener(this);

		// Notify listeners that row has been added.
		onColumnChanged();
	}

	@Kroll.method
	public void remove(Object row)
	{
		removeRow(row);
	}

	@Kroll.method
	public void removeAllChildren()
	{
		setRows(null);
	}

	@Kroll.method
	public void removeRow(Object value)
	{
		// Validate argument.
		if (!(value instanceof PickerRowProxy)) {
			Log.w(TAG, "Unable to remove given row. Must be of type: Ti.UI.PickerRow");
			return;
		}
		PickerRowProxy rowProxy = (PickerRowProxy) value;

		// Fetch index of given row by reference.
		int index = this.rowList.indexOf(rowProxy);
		if (index < 0) {
			return;
		}

		// Remove given row.
		this.rowList.remove(index);
		rowProxy.removeListener(this);

		// Notify listeners that row was removed.
		onColumnChanged();
	}

	@Kroll.getProperty
	public PickerRowProxy[] getRows()
	{
		return this.rowList.toArray(new PickerRowProxy[0]);
	}

	@Kroll.setProperty(retain = false)
	public void setRows(Object[] rows)
	{
		// Temporarily disable listeners.
		boolean wasEnabled = this.canInvokeListeners;
		this.canInvokeListeners = false;

		// Remove all rows.
		while (!this.rowList.isEmpty()) {
			removeRow(this.rowList.get(this.rowList.size() - 1));
		}

		// Add given rows.
		if (rows != null) {
			for (Object nextRow : rows) {
				add(nextRow);
			}
		}

		// Notify listeners that column has changed.
		this.canInvokeListeners = wasEnabled;
		onColumnChanged();
	}

	public PickerRowProxy getRowByIndex(int index)
	{
		if ((index >= 0) && (index < this.rowList.size())) {
			return this.rowList.get(index);
		}
		return null;
	}

	@Kroll.getProperty
	public int getRowCount()
	{
		return this.rowList.size();
	}

	@Override
	public void onChanged(PickerRowProxy row)
	{
		onColumnChanged();
	}

	private void onColumnChanged()
	{
		if (!canInvokeListeners) {
			return;
		}

		ArrayList<PickerColumnProxy.OnChangedListener> clonedListeners = new ArrayList<>(this.listeners);
		for (OnChangedListener listener : clonedListeners) {
			if (this.listeners.contains(listener)) {
				listener.onChanged(this);
			}
		}
	}

	@Override
	public String getApiName()
	{
		return "Ti.UI.PickerColumn";
	}
}

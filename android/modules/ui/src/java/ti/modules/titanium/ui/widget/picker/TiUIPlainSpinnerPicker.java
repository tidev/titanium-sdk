/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package ti.modules.titanium.ui.widget.picker;

import android.view.View;
import android.widget.NumberPicker;
import androidx.annotation.NonNull;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiDimension;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiCompositeLayout;
import ti.modules.titanium.ui.PickerColumnProxy;
import ti.modules.titanium.ui.PickerProxy;
import ti.modules.titanium.ui.PickerRowProxy;

public class TiUIPlainSpinnerPicker extends TiUIPlainPicker implements NumberPicker.OnValueChangeListener
{
	private static final String TAG = "TiUIPlainSpinnerPicker";

	public TiUIPlainSpinnerPicker(@NonNull PickerProxy proxy)
	{
		super(proxy);

		TiCompositeLayout layout = new TiCompositeLayout(
			proxy.getActivity(), TiCompositeLayout.LayoutArrangement.HORIZONTAL, proxy);
		layout.setEnableHorizontalWrap(true);
		setNativeView(layout);

		// Add all picker columns to the native view. Must be done last.
		recreateAllColumns();
	}

	@Override
	public void selectRow(int columnIndex, int rowIndex, boolean animated)
	{
		NumberPicker pickerView = getNumberPickerForIndex(columnIndex);
		if (pickerView != null) {
			rowIndex = Math.max(rowIndex, 0);
			rowIndex = Math.min(rowIndex, pickerView.getMaxValue());
			pickerView.setValue(rowIndex);
		}
	}

	@Override
	public void onColumnChanged(PickerColumnProxy columnProxy)
	{
		// Fetch the picker proxy.
		PickerProxy pickerProxy = getPickerProxy();
		if (pickerProxy == null) {
			return;
		}

		// Update the column's NumberPicker view.
		NumberPicker pickerView = getNumberPickerForIndex(pickerProxy.getColumnIndexOf(columnProxy));
		if (pickerView != null) {
			update(pickerView, columnProxy);
			pickerView.requestLayout();
		}
	}

	@Override
	public void onColumnListChanged()
	{
		recreateAllColumns();
	}

	@Override
	public void onValueChange(NumberPicker picker, int oldValue, int newValue)
	{
		// Fetch proxy and view group.
		PickerProxy pickerProxy = getPickerProxy();
		TiCompositeLayout layout = (TiCompositeLayout) getNativeView();
		if ((pickerProxy == null) || (layout == null)) {
			return;
		}

		// Fire a "change" event.
		for (int index = 0; index < layout.getChildCount(); index++) {
			if (layout.getChildAt(index) == picker) {
				pickerProxy.fireSelectionChange(index, newValue);
				break;
			}
		}
	}

	private NumberPicker getNumberPickerForIndex(int columnIndex)
	{
		// Fetch the view group hosting all picker column child views.
		TiCompositeLayout layout = (TiCompositeLayout) getNativeView();
		if (layout == null) {
			return null;
		}

		// Validate given column index.
		if ((columnIndex < 0) || (columnIndex >= layout.getChildCount())) {
			return null;
		}

		// Return the column's picker view.
		View childView = layout.getChildAt(columnIndex);
		if (childView instanceof NumberPicker) {
			return (NumberPicker) childView;
		}
		return null;
	}

	private void recreateAllColumns()
	{
		// Fetch the picker proxy.
		PickerProxy pickerProxy = getPickerProxy();
		if (pickerProxy == null) {
			return;
		}

		// Fetch the view group hosting all picker column child views.
		TiCompositeLayout layout = (TiCompositeLayout) getNativeView();
		if (layout == null) {
			return;
		}

		// Remove all previously created column pickers.
		layout.removeAllViews();

		// Create new column picker views and add them to layout.
		PickerColumnProxy[] columnProxies = pickerProxy.getColumns();
		for (int columnIndex = 0; columnIndex < columnProxies.length; columnIndex++) {
			// Create the column picker.
			NumberPicker pickerView = new NumberPicker(pickerProxy.getActivity());
			pickerView.setOnValueChangedListener(this);
			pickerView.setWrapSelectorWheel(false);
			pickerView.setDescendantFocusability(NumberPicker.FOCUS_BLOCK_DESCENDANTS); // Disable text editor.
			update(pickerView, columnProxies[columnIndex]);

			// Select a row based on proxy's last assigned index.
			int rowIndex = Math.max(pickerProxy.getSelectedRowIndex(columnIndex), 0);
			pickerView.setValue(Math.min(rowIndex, pickerView.getMaxValue()));

			// Add picker to layout.
			layout.addView(pickerView);
		}
	}

	private void update(NumberPicker pickerView, PickerColumnProxy columnProxy)
	{
		// Validate arguments.
		if ((pickerView == null) || (columnProxy == null)) {
			return;
		}

		// Fetch the picker proxy.
		PickerProxy pickerProxy = getPickerProxy();
		if (pickerProxy == null) {
			return;
		}

		// Fetch the currently selected row index. To be restored after updating column.
		int lastSelectedRowIndex = pickerView.getValue();

		// Set all row titles in the picker.
		// Note: Picker renders empty strings incorrectly. Use a single space character to represent them instead.
		PickerRowProxy[] rowProxyArray = columnProxy.getRows();
		if (rowProxyArray.length > 0) {
			String[] titleArray = new String[rowProxyArray.length];
			for (int index = 0; index < rowProxyArray.length; index++) {
				String title = rowProxyArray[index].getTitle();
				if ((title == null) || title.isEmpty()) {
					title = " ";
				}
				titleArray[index] = title;
			}
			pickerView.setDisplayedValues(titleArray);
			pickerView.setMaxValue(titleArray.length - 1);
		} else {
			pickerView.setDisplayedValues(new String[] { " " });
			pickerView.setMaxValue(0);
		}

		// Set the picker's width if configured.
		if (columnProxy.hasProperty(TiC.PROPERTY_WIDTH)) {
			TiCompositeLayout.LayoutParams layoutParams = new TiCompositeLayout.LayoutParams();
			Object value = columnProxy.getProperty(TiC.PROPERTY_WIDTH);
			if (value != null) {
				layoutParams.optionWidth = null;
				layoutParams.sizeOrFillWidthEnabled = true;
				if (value.equals(TiC.LAYOUT_SIZE)) {
					layoutParams.autoFillsWidth = false;
				} else if (value.equals(TiC.LAYOUT_FILL)) {
					layoutParams.autoFillsWidth = true;
				} else if (!value.equals(TiC.SIZE_AUTO)) {
					layoutParams.optionWidth =
						TiConvert.toTiDimension(TiConvert.toString(value), TiDimension.TYPE_WIDTH);
					layoutParams.sizeOrFillWidthEnabled = false;
				}
			}
			pickerView.setLayoutParams(layoutParams);
		}

		// Restore last selected row.
		pickerView.setValue(lastSelectedRowIndex);
	}
}

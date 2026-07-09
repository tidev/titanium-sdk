/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget.picker;

import android.content.Context;
import android.view.View;
import android.view.ViewGroup;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.AutoCompleteTextView;
import android.widget.TextView;
import androidx.annotation.NonNull;
import com.google.android.material.textfield.TextInputLayout;
import java.util.ArrayList;
import java.util.List;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiUIHelper;
import ti.modules.titanium.ui.PickerColumnProxy;
import ti.modules.titanium.ui.PickerProxy;
import ti.modules.titanium.ui.PickerRowProxy;

public class TiUIPlainDropDownPicker extends TiUIPlainPicker
{
	private static final String TAG = "TiUIPlainDropDownPicker";

	public TiUIPlainDropDownPicker(@NonNull PickerProxy proxy)
	{
		super(proxy);

		// Create the text field.
		TextInputLayout textInputLayout = proxy.createTextInputLayout();
		textInputLayout.addOnLayoutChangeListener(new View.OnLayoutChangeListener() {
			@Override
			public void onLayoutChange(
				View v, int left, int top, int right, int bottom,
				int oldLeft, int oldTop, int oldRight, int oldBottom)
			{
				TiUIHelper.firePostLayoutEvent(getProxy());
			}
		});
		setNativeView(textInputLayout);

		// Set up a selection listener.
		AutoCompleteTextView textView = (AutoCompleteTextView) textInputLayout.getEditText();
		textView.setOnItemClickListener((AdapterView<?> parent, View view, int position, long id) -> {
			if (proxy.getSelectedRowIndex(0) != position) {
				TiPickerAdapter adapter = (TiPickerAdapter) textView.getAdapter();
				if (adapter != null) {
					adapter.setSelectedIndex(position);
				}
				fireSelectionChange(0, position);
			}
		});

		// Add all rows to view. Must be done after calling setNativeView() method.
		updateAdapterList();
	}

	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue, KrollProxy proxy)
	{
		if (key.equals(TiC.PROPERTY_FONT)) {
			AutoCompleteTextView textView = getAutoCompleteTextView();
			if (textView != null) {
				TiPickerAdapter adapter = (TiPickerAdapter) textView.getAdapter();
				adapter.setFontProperties(getFontProperties());
				adapter.notifyDataSetChanged();
			}
		} else {
			super.propertyChanged(key, oldValue, newValue, proxy);
		}
	}

	@Override
	public void selectRow(int columnIndex, int rowIndex, boolean animated)
	{
		// Drop-down picker only supports 1 column.
		if (columnIndex != 0) {
			Log.w(TAG, "Ti.UI.Picker drop-down only supports 1 column. Cannot select row for column: " + columnIndex);
			return;
		}

		// Fetch text view.
		AutoCompleteTextView textView = getAutoCompleteTextView();
		TiPickerAdapter adapter = (textView != null) ? (TiPickerAdapter) textView.getAdapter() : null;
		if (adapter == null) {
			return;
		}

		// Select the given row in the view.
		String text = "";
		if (adapter.getCount() > 0) {
			rowIndex = Math.max(rowIndex, 0);
			rowIndex = Math.min(rowIndex, adapter.getCount() - 1);
			text = adapter.getItem(rowIndex).toString();
		}
		int lastRowIndex = adapter.getSelectedIndex();
		adapter.setSelectedIndex(rowIndex);
		textView.setText(text, false);

		// Fire a "change" event if the selected row changed.
		// Note: Do not fire the event if list was empty or currently empty.
		if ((rowIndex >= 0) && (lastRowIndex >= 0) && (rowIndex != lastRowIndex)) {
			fireSelectionChange(0, rowIndex);
		}
	}

	public void openPicker()
	{
		AutoCompleteTextView textView = getAutoCompleteTextView();
		if (textView != null) {
			textView.showDropDown();
		}
	}

	private void updateAdapterList()
	{
		// Fetch the picker's proxy.
		PickerProxy pickerProxy = getPickerProxy();
		if (pickerProxy == null) {
			return;
		}

		// Fetch the text field to update the drop-down list on.
		AutoCompleteTextView textView = getAutoCompleteTextView();
		if (textView == null) {
			return;
		}

		// Fetch all rows from the 1st column. (We do not support more than 1 column.)
		List<TiPickerAdapterItem> itemList = TiPickerAdapterItem.createListFrom(pickerProxy.getFirstColumn());

		// Update view's drop-down list.
		TiPickerAdapter adapter = (TiPickerAdapter) textView.getAdapter();
		int lastSelectedIndex = (adapter != null) ? adapter.getSelectedIndex() : -1;
		adapter = new TiPickerAdapter(textView.getContext(), android.R.layout.simple_spinner_dropdown_item, itemList);
		adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
		adapter.setFontProperties(getFontProperties());
		adapter.setSelectedIndex(lastSelectedIndex);
		textView.setAdapter(adapter);

		// Select a row.
		if (itemList.isEmpty()) {
			textView.clearListSelection();
		} else {
			selectRow(0, pickerProxy.getSelectedRowIndex(0), false);
		}
	}

	@Override
	public void onColumnChanged(PickerColumnProxy proxy)
	{
		updateAdapterList();
	}

	@Override
	public void onColumnListChanged()
	{
		updateAdapterList();
	}

	protected void fireSelectionChange(int columnIndex, int rowIndex)
	{
		PickerProxy pickerProxy = getPickerProxy();
		if (pickerProxy != null) {
			pickerProxy.fireSelectionChange(columnIndex, rowIndex);
		}
	}

	private AutoCompleteTextView getAutoCompleteTextView()
	{
		View view = getNativeView();
		if (view instanceof TextInputLayout) {
			view = ((TextInputLayout) view).getEditText();
			if (view instanceof AutoCompleteTextView) {
				return (AutoCompleteTextView) view;
			}
		}
		return null;
	}

	private String[] getFontProperties()
	{
		// Fetch font properties from proxy and return it as an array.
		String[] fontProperties = null;
		PickerProxy pickerProxy = getPickerProxy();
		if (pickerProxy != null) {
			PickerColumnProxy columnProxy = pickerProxy.getColumn(0);
			if (columnProxy != null) {
				// Fetch font properties from column proxy.
				fontProperties = TiUIHelper.getFontProperties(columnProxy.getProperties());
			}
			if ((fontProperties == null) || (fontProperties.length <= 0)) {
				// Fallback to fetching font properties from picker proxy.
				fontProperties = TiUIHelper.getFontProperties(pickerProxy.getProperties());
			}
		}
		return fontProperties;
	}

	private static class TiPickerAdapterItem
	{
		private final PickerRowProxy rowProxy;

		public TiPickerAdapterItem(PickerRowProxy rowProxy)
		{
			this.rowProxy = rowProxy;
		}

		public PickerRowProxy getRowProxy()
		{
			return this.rowProxy;
		}

		@Override
		public String toString()
		{
			if (this.rowProxy != null) {
				String title = this.rowProxy.getTitle();
				if (title != null) {
					return title;
				}
			}
			return "";
		}

		@NonNull
		public static List<TiPickerAdapterItem> createListFrom(PickerColumnProxy columnProxy)
		{
			return createListFrom((columnProxy != null) ? columnProxy.getRows() : null);
		}

		@NonNull
		public static List<TiPickerAdapterItem> createListFrom(PickerRowProxy[] proxyArray)
		{
			int itemCount = (proxyArray != null) ? proxyArray.length : 0;
			ArrayList<TiPickerAdapterItem> itemList = new ArrayList<>(itemCount);
			if (itemCount > 0) {
				for (PickerRowProxy nextProxy : proxyArray) {
					itemList.add(new TiPickerAdapterItem(nextProxy));
				}
			}
			return itemList;
		}
	}

	private static class TiPickerAdapter extends ArrayAdapter<TiPickerAdapterItem>
	{
		private String[] fontProperties;
		private int selectedIndex = -1;
		private int defaultTextColor;
		private boolean hasLoadedDefaultTextColor;

		public TiPickerAdapter(Context context, int textViewResourceId, List<TiPickerAdapterItem> objects)
		{
			super(context, textViewResourceId, objects);
		}

		@Override
		public View getView(int position, View convertView, ViewGroup parent)
		{
			TextView textView = (TextView) super.getView(position, convertView, parent);
			styleTextView(position, textView);
			return textView;
		}

		@Override
		public View getDropDownView(int position, View convertView, ViewGroup parent)
		{
			TextView textView = (TextView) super.getDropDownView(position, convertView, parent);
			styleTextView(position, textView);
			return textView;
		}

		public int getSelectedIndex()
		{
			return this.selectedIndex;
		}

		public void setSelectedIndex(int value)
		{
			value = Math.max(value, -1);
			value = Math.min(value, getCount() - 1);
			this.selectedIndex = value;
		}

		public String[] getFontProperties()
		{
			return this.fontProperties;
		}

		public void setFontProperties(String[] fontProperties)
		{
			this.fontProperties = fontProperties;
		}

		private void styleTextView(int position, TextView textView)
		{
			// Fetch text view's default text color if not done already.
			if (!this.hasLoadedDefaultTextColor) {
				this.defaultTextColor = textView.getCurrentTextColor();
				this.hasLoadedDefaultTextColor = true;
			}

			// Update text view's font if configured.
			if ((this.fontProperties != null) && (this.fontProperties.length > 0)) {
				TiUIHelper.styleText(
					textView,
					this.fontProperties[TiUIHelper.FONT_FAMILY_POSITION],
					this.fontProperties[TiUIHelper.FONT_SIZE_POSITION],
					this.fontProperties[TiUIHelper.FONT_WEIGHT_POSITION],
					this.fontProperties[TiUIHelper.FONT_STYLE_POSITION]);
			}

			// Update text color if configured.
			PickerRowProxy rowProxy = this.getItem(position).getRowProxy();
			if ((rowProxy != null) && rowProxy.hasProperty(TiC.PROPERTY_COLOR)) {
				Object color = rowProxy.getProperty(TiC.PROPERTY_COLOR);
				if (color == null) {
					textView.setTextColor(this.defaultTextColor);
				} else {
					textView.setTextColor(TiConvert.toColor(rowProxy.getColor(), rowProxy.getActivity()));
				}
			}
		}
	}
}

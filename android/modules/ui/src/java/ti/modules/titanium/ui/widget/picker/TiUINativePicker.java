/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget.picker;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiRHelper;
import org.appcelerator.titanium.util.TiRHelper.ResourceNotFoundException;
import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.PickerColumnProxy;
import ti.modules.titanium.ui.PickerProxy;
import android.app.Activity;
import android.content.Context;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewParent;
import android.widget.AdapterView;
import android.widget.AdapterView.OnItemSelectedListener;
import android.widget.ArrayAdapter;
import android.widget.Spinner;
import android.widget.TextView;

public class TiUINativePicker extends TiUIPicker
{
	private static final String TAG = "TiUINativePicker";
	private boolean nativeViewDrawn = false;
	private static int defaultTextColor;
	private static boolean setDefaultTextColor = false;

	public static class TiSpinnerAdapter<T> extends ArrayAdapter<T>
	{
		String[] fontProperties;

		public TiSpinnerAdapter(Context context, int textViewResourceId, List<T> objects)
		{
			super(context, textViewResourceId, objects);
		}

		@Override
		public View getView(int position, View convertView, ViewGroup parent)
		{
			TextView tv = (TextView) super.getView(position, convertView, parent);
			styleTextView(position, tv);
			return tv;
		}

		@Override
		public View getDropDownView(int position, View convertView, ViewGroup parent)
		{
			TextView tv = (TextView) super.getDropDownView(position, convertView, parent);
			styleTextView(position, tv);
			return tv;
		}

		public void setFontProperties(KrollDict d)
		{
			fontProperties = TiUIHelper.getFontProperties(d);
		}

		private void styleTextView(int position, TextView tv)
		{
			TiViewProxy rowProxy = (TiViewProxy) this.getItem(position);
			if (fontProperties != null) {
				TiUIHelper.styleText(
					tv, fontProperties[TiUIHelper.FONT_FAMILY_POSITION], fontProperties[TiUIHelper.FONT_SIZE_POSITION],
					fontProperties[TiUIHelper.FONT_WEIGHT_POSITION], fontProperties[TiUIHelper.FONT_STYLE_POSITION]);
			}
			if (!setDefaultTextColor) {
				defaultTextColor = tv.getCurrentTextColor();
				setDefaultTextColor = true;
			}
			if (rowProxy.hasProperty(TiC.PROPERTY_COLOR)) {
				final int color = TiConvert.toColor((String) rowProxy.getProperty(TiC.PROPERTY_COLOR));
				tv.setTextColor(color);
			} else {
				tv.setTextColor(defaultTextColor);
			}
		}
	}

	public TiUINativePicker(TiViewProxy proxy)
	{
		super(proxy);
	}
	public TiUINativePicker(final TiViewProxy proxy, Activity activity)
	{
		this(proxy);
		int spinnerId;
		try {
			spinnerId = TiRHelper.getResource("layout.titanium_ui_spinner");
		} catch (ResourceNotFoundException e) {
			if (Log.isDebugModeEnabled()) {
				Log.e(TAG, "XML resources could not be found!!!");
			}
			return;
		}
		final Spinner spinner = (Spinner) activity.getLayoutInflater().inflate(spinnerId, null);

		spinner.addOnLayoutChangeListener(new View.OnLayoutChangeListener() {
			@Override
			public void onLayoutChange(View v, int left, int top, int right, int bottom, int oldLeft, int oldTop,
									   int oldRight, int oldBottom)
			{
				TiUIHelper.firePostLayoutEvent(proxy);
				// Set the flag showing if the native view has been drawn
				nativeViewDrawn = true;
				// Attach the listener for the first time after
				// all the setting up has finished.
				spinner.setOnItemSelectedListener(onItemSelectedListener);
			}
		});

		spinner.setOnTouchListener(new View.OnTouchListener() {
			@Override
			public boolean onTouch(View v, MotionEvent event)
			{
				if (event.getAction() == MotionEvent.ACTION_UP) {
					KrollDict data = new KrollDict();
					data.put(TiC.PROPERTY_X, event.getX());
					data.put(TiC.PROPERTY_Y, event.getY());
					fireEvent(TiC.EVENT_CLICK, data);
				}
				return false;
			}
		});

		setNativeView(spinner);
		refreshNativeView();
		preselectRows();
	}

	private void preselectRows()
	{
		Spinner spinner = (Spinner) nativeView;
		ArrayList<Integer> preselectedRows = getPickerProxy().getPreselectedRows();
		if (preselectedRows == null || preselectedRows.size() == 0) {
			return;
		}
		if (spinner == null)
			return;
		for (int i = 0; i < preselectedRows.size(); i++) {
			Integer rowIndex = preselectedRows.get(i);
			if (rowIndex == 0 || rowIndex.intValue() < 0) {
				continue;
			}
			selectRow(i, rowIndex, false);
		}
	}

	@Override
	public void selectRow(int columnIndex, int rowIndex, boolean animated)
	{
		// At the moment we only support one column.
		if (columnIndex != 0) {
			Log.w(TAG, "Only one column is supported. Ignoring request to set selected row of column " + columnIndex);
			return;
		}
		Spinner view = (Spinner) nativeView;
		int rowCount = view.getAdapter().getCount();
		if (rowIndex < 0 || rowIndex >= rowCount) {
			Log.w(TAG, "Ignoring request to select out-of-bounds row index " + rowIndex);
			return;
		}
		view.setSelection(rowIndex, animated);
	}

	@Override
	public void openPicker()
	{
		Spinner view = (Spinner) nativeView;
		view.performClick();
	}

	@Override
	public int getSelectedRowIndex(int columnIndex)
	{
		if (columnIndex != 0) {
			Log.w(TAG, "Ignoring request to get selected row from out-of-bounds columnIndex " + columnIndex);
			return -1;
		}
		return ((Spinner) getNativeView()).getSelectedItemPosition();
	}

	@Override
	protected void refreshNativeView()
	{
		// Don't allow change events here
		Spinner spinner = (Spinner) nativeView;
		if (spinner == null) {
			return;
		}
		try {
			if (nativeViewDrawn) {
				// If we have drawn the spinner it has a selected item listener.
				// Detach while the native view is refreshed to prevent
				// unnecessary event triggers.
				spinner.setOnItemSelectedListener(null);
			}
			int rememberSelectedRow = getPickerProxy().getLastSelectedIndex();
			// Just one column - the first column - for now.
			// Maybe someday we'll support multiple columns.
			PickerColumnProxy column = getPickerProxy().getFirstColumn(false);
			if (column == null) {
				return;
			}
			TiViewProxy[] rowArray = column.getChildren();
			if (rowArray == null || rowArray.length == 0) {
				return;
			}
			ArrayList<TiViewProxy> rows = new ArrayList<TiViewProxy>(Arrays.asList(rowArray));
			// At the moment we're using the simple spinner layouts provided
			// in android because we're only supporting a piece of text, which
			// is fetched via PickerRowProxy.toString(). If we allow
			// anything beyond a string, we'll have to implement our own
			// layouts (maybe our own Adapter too.)
			TiSpinnerAdapter<TiViewProxy> adapter =
				new TiSpinnerAdapter<TiViewProxy>(spinner.getContext(), android.R.layout.simple_spinner_item, rows);
			adapter.setFontProperties(proxy.getProperties());
			adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
			spinner.setAdapter(adapter);
			if (rememberSelectedRow >= 0) {
				selectRow(0, rememberSelectedRow, false);
			}
			// The new adapter has been set.
			// If the Spinner has been drawn reattach the onItemSelected listener here.
			// If it has not been drawn yet, the listener will be attached in the
			// onLayout lifecycle event.
			if (nativeViewDrawn) {
				spinner.setOnItemSelectedListener(onItemSelectedListener);
			}
		} catch (Throwable t) {
			Log.e(TAG, "Unable to refresh native spinner control: " + t.getMessage(), t);
		}
	}

	private final OnItemSelectedListener onItemSelectedListener = new OnItemSelectedListener() {
		@Override
		public void onItemSelected(AdapterView<?> parent, View view, int position, long itemId)
		{
			// if the user selects a new item form the picker
			// it should overwrite the values stored in preselected rows
			getPickerProxy().getPreselectedRows().clear();
			getPickerProxy().setLastSelectedIndex(position);
			fireSelectionChange(0, position);

			// Invalidate the parent view after the item is selected (TIMOB-13540).
			ViewParent p = nativeView.getParent();
			if (p instanceof View) {
				((View) p).invalidate();
			}
		}

		@Override
		public void onNothingSelected(AdapterView<?> parent)
		{
		}
	};

	public void add(TiUIView child)
	{
		// Don't do anything.  We don't add/remove views to the native picker (the Android "Spinner").
	}
	@Override
	public void remove(TiUIView child)
	{
		// Don't do anything.  We don't add/remove views to the native picker (the Android "Spinner").
	}
	@Override
	public void onColumnAdded(int columnIndex)
	{
		if (!batchModelChange) {
			refreshNativeView();
		}
	}
	@Override
	public void onColumnRemoved(int oldColumnIndex)
	{
		if (!batchModelChange) {
			refreshNativeView();
		}
	}
	@Override
	public void onColumnModelChanged(int columnIndex)
	{
		if (!batchModelChange) {
			refreshNativeView();
		}
	}
	@Override
	public void onRowChanged(int columnIndex, int rowIndex)
	{
		if (!batchModelChange) {
			refreshNativeView();
		}
	}
	protected void fireSelectionChange(int columnIndex, int rowIndex)
	{
		((PickerProxy) proxy).fireSelectionChange(columnIndex, rowIndex);
	}

	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue, KrollProxy proxy)
	{
		if (key.equals(TiC.PROPERTY_FONT)) {
			Spinner spinner = (Spinner) nativeView;
			TiSpinnerAdapter<TiViewProxy> adapter = (TiSpinnerAdapter<TiViewProxy>) spinner.getAdapter();
			adapter.setFontProperties(proxy.getProperties());
			adapter.notifyDataSetChanged();
		} else {
			super.propertyChanged(key, oldValue, newValue, proxy);
		}
	}
}

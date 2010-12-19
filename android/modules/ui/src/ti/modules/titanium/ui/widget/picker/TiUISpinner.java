/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package ti.modules.titanium.ui.widget.picker;

import java.util.ArrayList;

import kankan.wheel.widget.WheelView;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.KrollProxyListener;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiUIHelper;

import ti.modules.titanium.ui.PickerRowProxy;
import android.graphics.Typeface;
import android.widget.LinearLayout;

public class TiUISpinner extends TiUIPicker
		implements WheelView.OnItemSelectedListener, KrollProxyListener
{
	private static final String LCAT = "TiUISpinner";
	private boolean ignoreItemSelection = false;
	private ArrayList<WheelView> wheels;
	private LinearLayout layout;
	private Typeface typeface = null;
	private Float fontSize = null;
	private Integer color = null;
	private Integer visibleItemsCount = new Integer(5);
	
	public TiUISpinner(TiViewProxy proxy)
	{
		super(proxy);
		layout = new LinearLayout(proxy.getContext());
		layout.setOrientation(LinearLayout.HORIZONTAL);
		setNativeView(layout);
	}
	
	@Override
	protected void refreshNativeView()
	{
		ignoreItemSelection = true;
		try {
			// Remember selected indices, to set them back
			ArrayList<Integer> selectedIndices = getSelectedRowIndices();
			LinearLayout layout = (LinearLayout)getNativeView();

			boolean doSetNative = false;
			if (layout == null) {
				doSetNative = true;
				layout = new LinearLayout(proxy.getContext());
				layout.setOrientation(LinearLayout.HORIZONTAL);
			} else {
				layout.removeAllViews();
			}
			if (wheels != null) {
				wheels.clear();
			}
			if (columns != null) {
				if (wheels == null) {
					wheels = new ArrayList<WheelView>(columns.size());
				}

				for (ArrayList<PickerRowProxy> rowset : columns) {
					TextWheelAdapter adapter = new TextWheelAdapter(rowset.toArray());
					WheelView view = new WheelView(proxy.getContext());
					view.setVisibleItems(visibleItemsCount.intValue());
					applyStyle(view);
					view.setAdapter(adapter);
					view.setItemSelectedListener(this);
					wheels.add(view);
					layout.addView(view);
				}
			}
			if (doSetNative) {
				setNativeView(layout);
			}

			// Reselect the selected indices, if applicable
			if (selectedIndices != null && selectedIndices.size() == wheels.size()) {
				for (int colnum = 0; colnum < wheels.size(); colnum++) {
					int rowIndex = selectedIndices.get(colnum).intValue();
					selectRow(colnum, rowIndex, false);
				}
			}
		} finally {
			ignoreItemSelection = false;
		}
	}

	private void applyStyle(WheelView view)
	{
		if (fontSize == null) {
			String sFontSize = TiUIHelper.getDefaultFontSize(proxy.getContext());
			fontSize = new Float(TiUIHelper.getSize(sFontSize));
		}
		view.setTextSize(fontSize.intValue());
		if (color != null) {
			view.setTextColor(color.intValue());
		}
		if (typeface != null) {
			view.setTypeface(typeface);
		}
		
	}
	
	@Override
	public void processProperties(KrollDict d) {
		super.processProperties(d);
		if (d.containsKey(TiC.PROPERTY_FONT)) {
			setFontProperties(d.getKrollDict(TiC.PROPERTY_FONT));
		}
		if (d.containsKey(TiC.PROPERTY_COLOR)) {
			color = new Integer(TiConvert.toColor(d, "color"));
		}
		if (d.containsKey("visibleItems")) {
			visibleItemsCount = new Integer(TiConvert.toInt(d, "visibleItems"));
		}
		refreshNativeView();
	}

	private void setFontProperties(KrollDict font)
	{
		if (font.containsKey("fontSize")) {
			String sFontSize = TiConvert.toString(font, "fontSize");
			fontSize = new Float(TiUIHelper.getSize(sFontSize));
		}
		if (font.containsKey("fontFamily")) {
			String fontFamily = TiConvert.toString(font, "fontFamily");
			typeface = TiUIHelper.toTypeface(fontFamily);
		}
	}

	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue,
			KrollProxy proxy)
	{
		boolean mustRefresh = false;
		if (key == TiC.PROPERTY_FONT && newValue instanceof KrollDict) {
			setFontProperties((KrollDict)newValue);
			mustRefresh = true;
		} else if (key == TiC.PROPERTY_COLOR) {
			color = new Integer(TiConvert.toColor(TiConvert.toString(newValue)));
			mustRefresh = true;
		} else if (key == "visibleItems") {
			visibleItemsCount = new Integer(TiConvert.toInt(newValue));
			mustRefresh = true;
		} else {
			super.propertyChanged(key, oldValue, newValue, proxy);	
		}
		if (mustRefresh) {
			refreshNativeView();
		}
	}
	
	@Override
	public void onItemSelected(WheelView view, int index)
	{
		if (ignoreItemSelection) {
			return;
		}
		int columnIndex = wheels.indexOf(view);

		KrollDict d = new KrollDict();
		d.put("rowIndex", index);
		d.put("columnIndex", columnIndex);
		d.put("row", columns.get(columnIndex).get(index));
		d.put("column", columns.get(columnIndex));
		// selectedValue is an array of _all_ of the selected values
		ArrayList<String> selectedValues = new ArrayList<String>(columns.size());
		for (int i = 0; i < columns.size(); i++) {
			PickerRowProxy row = getSelectedRow(i);
			if (row != null) {
				selectedValues.add(row.toString());
			} else {
				selectedValues.add(null);
			}
		}
		d.put("selectedValue", selectedValues.toArray());
		proxy.fireEvent("change", d);
	}

	@Override
	public void selectRow(int columnIndex, int rowIndex, boolean animated)
	{
		if ( (1 + columnIndex) > getColumnCount()) {
			Log.w(LCAT, "selectRow ignored - columnIndex " + columnIndex + " does not exist.");
			return;
		}

		if ( (1 + rowIndex) > columns.get(columnIndex).size()) {
			Log.w(LCAT, "selectRow ignored - rowIndex " + rowIndex + " does not exist in column " + columnIndex);
			return;
		}

		wheels.get(columnIndex).setCurrentItem(rowIndex);

	}

	@Override
	public PickerRowProxy getSelectedRow(int columnIndex)
	{
		int colCount = getColumnCount();
		if (colCount == 0 || (1 + columnIndex) > colCount) {
			Log.w(LCAT, "getSelectedRow - there is no column with index " + columnIndex);
			return null;
		}
		int selectedIndex = wheels.get(columnIndex).getCurrentItem();
		if (selectedIndex >= 0) {
			return columns.get(columnIndex).get(selectedIndex);
		} else {
			Log.w(LCAT, "getSelectedRow - there is no row selected in column " + columnIndex);
			return null;
		}
	}

	@Override
	public boolean isRedrawRequiredForModelChanges()
	{
		return true;
	}

	private ArrayList<Integer> getSelectedRowIndices()
	{
		if (wheels == null || wheels.size() == 0) return null;
		ArrayList<Integer> indices = new ArrayList<Integer>(wheels.size());
		for (WheelView view : wheels) {
			indices.add(new Integer(view.getCurrentItem()));
		}
		return indices;
	}

	@Override
	public void release()
	{
		super.release();
		if (wheels != null) {
			wheels.clear();
			wheels = null;
		}
		layout = null;
	}
}

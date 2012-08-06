/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package ti.modules.titanium.ui.widget.picker;

import java.util.ArrayList;
import java.util.HashMap;

import kankan.wheel.widget.WheelView;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.PickerColumnProxy;
import ti.modules.titanium.ui.PickerProxy;
import ti.modules.titanium.ui.PickerRowProxy;
import android.graphics.Typeface;

public class TiUISpinnerColumn extends TiUIView implements WheelView.OnItemSelectedListener
{
	
	private static final String TAG = "TiUISpinnerColumn";
	private boolean suppressItemSelected = false;
	
	public TiUISpinnerColumn(TiViewProxy proxy)
	{
		super(proxy);
		refreshNativeView();
		preselectRow();
		((WheelView)nativeView).setItemSelectedListener(this);
	}
	
	private void preselectRow()
	{
		if (proxy.getParent() instanceof PickerProxy) {
			ArrayList<Integer> preselectedRows = ((PickerProxy)proxy.getParent()).getPreselectedRows();
			if (preselectedRows == null || preselectedRows.size() == 0) {
				return;
			}
			int columnIndex = ((PickerColumnProxy)proxy).getThisColumnIndex();
			if (columnIndex >= 0 && columnIndex < preselectedRows.size()) {
				Integer rowIndex = preselectedRows.get(columnIndex);
				if (rowIndex != null && rowIndex.intValue() >= 0) {
					selectRow(rowIndex);
				}
			}
		}
	}

	@Override
	public void processProperties(KrollDict d) {
		super.processProperties(d);
		if (d.containsKeyStartingWith("font")) {
			setFontProperties();
		}
		if (d.containsKey(TiC.PROPERTY_COLOR)) {
			((WheelView)nativeView).setTextColor(new Integer(TiConvert.toColor(d, TiC.PROPERTY_COLOR)));
		}
		if (d.containsKey(TiC.PROPERTY_VISIBLE_ITEMS)) {
			((WheelView)nativeView).setVisibleItems(TiConvert.toInt(d, TiC.PROPERTY_VISIBLE_ITEMS));
		} else {
			((WheelView)nativeView).setVisibleItems(PickerProxy.DEFAULT_VISIBLE_ITEMS_COUNT);
		}
		if (d.containsKey(TiC.PROPERTY_SELECTION_INDICATOR)) {
			((WheelView)nativeView).setShowSelectionIndicator(TiConvert.toBoolean(d, TiC.PROPERTY_SELECTION_INDICATOR));
		}
		refreshNativeView();
	}

	private void setFontProperties()
	{
		WheelView view = (WheelView)nativeView;
		String fontFamily = null;
		Float fontSize = null;
		String fontWeight = null;
		Typeface typeface = null;
		// TODO KrollDict d = proxy.getProperties();
		KrollDict d = new KrollDict();
		if (d.containsKey(TiC.PROPERTY_FONT) && d.get(TiC.PROPERTY_FONT) instanceof HashMap) {
			KrollDict font = d.getKrollDict(TiC.PROPERTY_FONT);
			if (font.containsKey("fontSize")) {
				String sFontSize = TiConvert.toString(font, "fontSize");
				fontSize = new Float(TiUIHelper.getSize(sFontSize));
			}
			if (font.containsKey("fontFamily")) {
				fontFamily = TiConvert.toString(font, "fontFamily");
			}
			if (font.containsKey("fontWeight")) {
				fontWeight = TiConvert.toString(font, "fontWeight");
			}
		}
		if (d.containsKeyAndNotNull(TiC.PROPERTY_FONT_FAMILY)) {
			fontFamily = TiConvert.toString(d, TiC.PROPERTY_FONT_FAMILY);
		}
		if (d.containsKeyAndNotNull(TiC.PROPERTY_FONT_SIZE)) {
			String sFontSize = TiConvert.toString(d, TiC.PROPERTY_FONT_SIZE);
			fontSize = new Float(TiUIHelper.getSize(sFontSize));
		}
		if (d.containsKeyAndNotNull(TiC.PROPERTY_FONT_WEIGHT)) {
			fontWeight = TiConvert.toString(d, TiC.PROPERTY_FONT_WEIGHT);
		}
		if (fontFamily != null) {
			typeface = TiUIHelper.toTypeface(fontFamily);
		}
		Integer typefaceWeight = null;
		if (fontWeight != null) {
			typefaceWeight = new Integer(TiUIHelper.toTypefaceStyle(fontWeight));
		}
		
		boolean dirty = false;
		if (typeface != null) {
			dirty = dirty || !typeface.equals(view.getTypeface());
			view.setTypeface(typeface);
		}
		if (typefaceWeight != null) {
			dirty = dirty || typefaceWeight.intValue() != view.getTypefaceWeight();
			view.setTypefaceWeight(typefaceWeight);
		}
		if (fontSize != null) {
			int fontSizeInt = fontSize.intValue();
			dirty = dirty || fontSizeInt != view.getTextSize();
			view.setTextSize(fontSize.intValue());
		}
		if (dirty) {
			((PickerColumnProxy)proxy).parentShouldRequestLayout();
		}
	}

	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue,
			KrollProxy proxy)
	{
		if (key.startsWith("font")) {
			setFontProperties();
		} else if (key.equals(TiC.PROPERTY_COLOR)) {
			((WheelView)nativeView).setTextColor(new Integer(TiConvert.toColor(TiConvert.toString(newValue))));
		} else if (key.equals(TiC.PROPERTY_VISIBLE_ITEMS)) {
			((WheelView)nativeView).setVisibleItems(TiConvert.toInt(newValue));
		} else if (key.equals(TiC.PROPERTY_SELECTION_INDICATOR)) {
			((WheelView)nativeView).setShowSelectionIndicator(TiConvert.toBoolean(newValue));
		} else {
			super.propertyChanged(key, oldValue, newValue, proxy);	
		}
	}
	
	
	public void refreshNativeView()
	{
		WheelView view = null;
		if (nativeView instanceof WheelView) {
			view = (WheelView)nativeView;
		} else {
			view = new WheelView(proxy.getActivity());
			Float defaultFontSize = new Float(TiUIHelper.getSize(TiUIHelper.getDefaultFontSize(proxy.getActivity())));
			view.setTextSize(defaultFontSize.intValue());
			setNativeView(view);
		}
		int selectedRow = view.getCurrentItem();
		PickerRowProxy[] rows = ((PickerColumnProxy)proxy).getRows();
		int rowCount = (rows == null) ? 0 : rows.length;
		if (selectedRow >= rowCount) {
			suppressItemSelected = true;
			if (rowCount > 0) {
				view.setCurrentItem(rowCount - 1);
			} else {
				view.setCurrentItem(0);
			}
			suppressItemSelected = false;
		}
		TextWheelAdapter adapter = new TextWheelAdapter(rows);
		view.setAdapter(adapter);
	}
	
	public void selectRow(int rowIndex)
	{
		if (nativeView instanceof WheelView) {
			WheelView view = (WheelView)nativeView;
			if (rowIndex < 0 || rowIndex >= view.getAdapter().getItemsCount()) {
				Log.w(TAG, "Ignoring attempt to select out-of-bound row index " + rowIndex);
				return;
			}
			view.setCurrentItem(rowIndex);
		}
	}

	@Override
	public void onItemSelected(WheelView view, int index)
	{
		if (suppressItemSelected) {
			return;
		}
		((PickerColumnProxy)proxy).onItemSelected(index);
	}
	
	public int getSelectedRowIndex()
	{
		int result = -1;
		if (nativeView instanceof WheelView) {
			result = ((WheelView)nativeView).getCurrentItem();
		}
		return result;
	}

	public void forceRequestLayout()
	{
		if (nativeView instanceof WheelView) {
			((WheelView)nativeView).fullLayoutReset();
		}
	}

}

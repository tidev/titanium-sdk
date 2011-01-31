/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package ti.modules.titanium.ui.widget.picker;

import java.util.ArrayList;

import kankan.wheel.widget.WheelView;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.view.TiUIView;

import android.graphics.Typeface;

import ti.modules.titanium.ui.PickerColumnProxy;
import ti.modules.titanium.ui.PickerRowProxy;
import ti.modules.titanium.ui.PickerProxy;

public class TiUISpinnerColumn extends TiUIView implements WheelView.OnItemSelectedListener
{
	
	private Typeface typeface = null;
	private Float fontSize = null;
	private Integer color = null;
	private static final String LCAT = "TiUISpinnerColumn";
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
		boolean reapplyStyle = false;
		if (key == TiC.PROPERTY_FONT && newValue instanceof KrollDict) {
			setFontProperties((KrollDict)newValue);
			reapplyStyle = true;
		} else if (key == TiC.PROPERTY_COLOR) {
			color = new Integer(TiConvert.toColor(TiConvert.toString(newValue)));
			reapplyStyle = true;
		} else {
			super.propertyChanged(key, oldValue, newValue, proxy);	
		}
		if (reapplyStyle) {
			applyStyle((WheelView)getNativeView());
		}
	}
	
	
	public void refreshNativeView()
	{
		WheelView view = null;
		if (nativeView instanceof WheelView) {
			view = (WheelView)nativeView;
		} else {
			view = new WheelView(proxy.getContext());
			setNativeView(view);
			view.setVisibleItems(((PickerColumnProxy)proxy).getVisibleItems());
			applyStyle(view);
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
				Log.w(LCAT, "Ignoring attempt to select out-of-bound row index " + rowIndex);
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

}

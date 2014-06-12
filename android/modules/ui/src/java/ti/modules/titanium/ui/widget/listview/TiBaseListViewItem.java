/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package ti.modules.titanium.ui.widget.listview;

import java.util.HashMap;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.titanium.TiDimension;
import org.appcelerator.titanium.view.TiCompositeLayout;
import org.appcelerator.titanium.view.TiUIView;

import android.content.Context;
import android.util.AttributeSet;
import android.view.MotionEvent;
import android.view.View.MeasureSpec;

public class TiBaseListViewItem extends TiCompositeLayout{

	private HashMap<String, ViewItem> viewsMap;
	private ViewItem viewItem;
	private int minHeight;
	public TiBaseListViewItem(Context context) {
		super(context);
		viewsMap = new HashMap<String, ViewItem>();
	}
	
	public TiBaseListViewItem(Context context, AttributeSet set) {
		super(context, set);
		setId(TiListView.listContentId);
		TiDimension heightDimension = new TiDimension(TiListView.MIN_ROW_HEIGHT, TiDimension.TYPE_UNDEFINED);
		minHeight = heightDimension.getAsPixels(this);
		setMinimumHeight(minHeight);
		viewsMap = new HashMap<String, ViewItem>();
		viewItem = new ViewItem(null, new KrollDict());
	}
	
	public HashMap<String, ViewItem> getViewsMap() {
		return viewsMap;
	}
	
	public ViewItem getViewItem() {
		return viewItem;
	}
	
	public void bindView(String binding, ViewItem view) {
		viewsMap.put(binding, view);
	}
	
	public TiUIView getViewFromBinding(String binding) {
		ViewItem viewItem = viewsMap.get(binding);
		if (viewItem != null) {
			return viewItem.getView();
		}
		return null;
	}
	
	protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec) {
		int h = MeasureSpec.getSize(heightMeasureSpec);
		int hMode = MeasureSpec.getMode(heightMeasureSpec);
		if (h < minHeight && hMode == MeasureSpec.EXACTLY) {
			h = minHeight;
		}
		super.onMeasure(widthMeasureSpec, MeasureSpec.makeMeasureSpec(h, hMode));
	}
	
}

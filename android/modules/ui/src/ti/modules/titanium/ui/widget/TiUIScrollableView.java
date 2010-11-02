/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget;

import java.util.ArrayList;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiCompositeLayout;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.ScrollableViewProxy;
import android.os.Handler;

public class TiUIScrollableView extends TiUIView
{
	public TiUIScrollableView(ScrollableViewProxy proxy, Handler handler)
	{
		super(proxy);

		TiScrollableView view = new TiScrollableView(proxy, handler);
		TiCompositeLayout.LayoutParams params = getLayoutParams();
		params.autoFillsHeight = true;
		params.autoFillsWidth = true;
		setNativeView(view);
	}

	private TiScrollableView getView() {
		return (TiScrollableView)getNativeView();
	}

	@Override
	public void processProperties(KrollDict d) {
		if (d.containsKey("views")) {
			getView().setViews(d.get("views"));
		} 
		if (d.containsKey("showPagingControls")) {
			getView().setShowPagingControl(TiConvert.toBoolean(d, "showPagingControls"));
		} 
		if (d.containsKey("currentPage")) {
			setCurrentPage(TiConvert.toInt(d, "currentPage"));
		}
		super.processProperties(d);
	}

	
	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue, KrollProxy proxy) {
		if("currentPage".equals(key)) {
			setCurrentPage(TiConvert.toInt(newValue));
		} else {
			super.propertyChanged(key, oldValue, newValue, proxy);
		}
	}

	public ArrayList<TiViewProxy> getViews() {
		return getView().getViews();
	}

	public void setViews(Object viewsObject) {
		getView().setViews(viewsObject);
		if (proxy.hasProperty("currentPage")) {
			setCurrentPage(TiConvert.toInt(proxy.getProperty("currentPage")));
		}
	}

	public void addView(TiViewProxy proxy) {
		getView().addView(proxy);
	}
	
	public void removeView(TiViewProxy proxy) {
		getView().removeView(proxy);
	}

	public void showPager()
	{
		boolean showPagingControl = TiConvert.toBoolean(proxy.getProperty("showPagingControl"));
		if (showPagingControl) {
			getView().showPager();
		}
	}

	public void hidePager()
	{
		getView().hidePager();
	}

	public void doMoveNext()
	{
		getView().doMoveNext();
	}

	public void doMovePrevious()
	{
		getView().doMovePrevious();
	}

	public void doScrollToView(Object view)
	{
		if (view instanceof Number) {
			getView().doScrollToView(((Number)view).intValue());
		} else if (view instanceof TiViewProxy) {
			getView().doScrollToView((TiViewProxy)view);
		}
	}

	public void setShowPagingControl(boolean showPagingControl)
	{
		getView().setShowPagingControl(showPagingControl);
	}

	public int getCurrentPage()
	{
		return getView().getSelectedItemPosition();
	}

	public void setCurrentPage(int page)
	{
		getView().doSetCurrentPage(page);
	}

	public void doSetCurrentPage(Object view) {
		if (view instanceof Number) {
			getView().doSetCurrentPage(((Number) view).intValue());
		} else if (view instanceof TiViewProxy) {
			getView().doSetCurrentPage((TiViewProxy) view);
		}
	}
}

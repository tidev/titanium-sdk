/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.kroll.common.TiConfig;
import org.appcelerator.titanium.TiBaseActivity;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiDimension;
import org.appcelerator.titanium.TiLifecycle.OnLifecycleEvent;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.TableViewProxy;
import ti.modules.titanium.ui.widget.searchbar.TiUISearchBar;
import ti.modules.titanium.ui.widget.tableview.TableViewModel;
import ti.modules.titanium.ui.widget.tableview.TiTableView;
import ti.modules.titanium.ui.widget.tableview.TiTableView.OnItemClickedListener;
import ti.modules.titanium.ui.widget.tableview.TiTableView.OnItemLongClickedListener;
import android.app.Activity;
import android.view.Gravity;
import android.widget.ListView;
import android.widget.RelativeLayout;

public class TiUITableView extends TiUIView
	implements OnItemClickedListener, OnItemLongClickedListener, OnLifecycleEvent
{
	private static final String LCAT = "TitaniumTableView";	
	private static final boolean DBG = TiConfig.LOGD;

	protected TiTableView tableView;

	public TiUITableView(TiViewProxy proxy)
	{
		super(proxy);
		getLayoutParams().autoFillsHeight = true;
		getLayoutParams().autoFillsWidth = true;
	}

	@Override
	public void onClick(KrollDict data)
	{
		proxy.fireEvent(TiC.EVENT_CLICK, data);
	}

	@Override
	public boolean onLongClick(KrollDict data)
	{
		return proxy.fireEvent(TiC.EVENT_LONGCLICK, data);
	}

	public void setModelDirty()
	{
		tableView.getTableViewModel().setDirty();
	}
	
	public TableViewModel getModel()
	{
		return tableView.getTableViewModel();
	}

	public void updateView()
	{
		tableView.dataSetChanged();
	}

	public void scrollToIndex(final int index)
	{
		tableView.getListView().setSelection(index);
	}

	public void scrollToTop(final int index)
	{
		tableView.getListView().setSelectionFromTop(index, 0);
	}

	public TiTableView getTableView()
	{
		return tableView;
	}

	public ListView getListView()
	{
		return tableView.getListView();
	}
	
	@Override
	public void processProperties(KrollDict d)
	{
		// Don't create a new table view if one already exists
		if (tableView == null) {
			tableView = new TiTableView((TableViewProxy) proxy);
		}
		Activity activity = proxy.getActivity();
		if (activity instanceof TiBaseActivity) {
			((TiBaseActivity) activity).addOnLifecycleEventListener(this);
		}

		tableView.setOnItemClickListener(this);
		tableView.setOnItemLongClickListener(this);

		if (d.containsKey(TiC.PROPERTY_SEARCH)) {
			RelativeLayout layout = new RelativeLayout(proxy.getActivity());
			layout.setGravity(Gravity.NO_GRAVITY);
			layout.setPadding(0, 0, 0, 0);

			TiViewProxy searchView = (TiViewProxy) d.get(TiC.PROPERTY_SEARCH);
			TiUISearchBar searchBar = (TiUISearchBar)searchView.getOrCreateView();
			searchBar.setOnSearchChangeListener(tableView);
			searchBar.getNativeView().setId(102);

			RelativeLayout.LayoutParams p = new RelativeLayout.LayoutParams(
					RelativeLayout.LayoutParams.FILL_PARENT,
					RelativeLayout.LayoutParams.FILL_PARENT);
			p.addRule(RelativeLayout.ALIGN_PARENT_TOP);
			p.addRule(RelativeLayout.ALIGN_PARENT_LEFT);
			p.addRule(RelativeLayout.ALIGN_PARENT_RIGHT);

			TiDimension rawHeight;
			if (searchView.hasProperty("height")) {
				rawHeight = TiConvert.toTiDimension(searchView.getProperty("height"), 0);
			} else {
				rawHeight = TiConvert.toTiDimension("52dp", 0);
			}
			p.height = rawHeight.getAsPixels(layout);

			layout.addView(searchBar.getNativeView(), p);

			p = new RelativeLayout.LayoutParams(
				RelativeLayout.LayoutParams.FILL_PARENT,
				RelativeLayout.LayoutParams.FILL_PARENT);
			p.addRule(RelativeLayout.ALIGN_PARENT_LEFT);
			p.addRule(RelativeLayout.ALIGN_PARENT_BOTTOM);
			p.addRule(RelativeLayout.ALIGN_PARENT_RIGHT);
			p.addRule(RelativeLayout.BELOW, 102);
			layout.addView(tableView, p);
			setNativeView(layout);
		} else {
			setNativeView(tableView);
		}

		if (d.containsKey(TiC.PROPERTY_FILTER_ATTRIBUTE)) {
			tableView.setFilterAttribute(TiConvert.toString(d, TiC.PROPERTY_FILTER_ATTRIBUTE));
		} else {
			// Default to title to match iPhone default.
			proxy.setProperty(TiC.PROPERTY_FILTER_ATTRIBUTE, TiC.PROPERTY_TITLE, false);
			tableView.setFilterAttribute(TiC.PROPERTY_TITLE);
		}

		boolean filterCaseInsensitive = true;
		if (d.containsKey(TiC.PROPERTY_FILTER_CASE_INSENSITIVE)) {
			filterCaseInsensitive = TiConvert.toBoolean(d, TiC.PROPERTY_FILTER_CASE_INSENSITIVE);
		}
		tableView.setFilterCaseInsensitive(filterCaseInsensitive);
		super.processProperties(d);
	}

	@Override
	public void onResume(Activity activity) {
		if (tableView != null) {
			tableView.dataSetChanged();
		}
	}

	@Override public void onStop(Activity activity) {}
	@Override public void onStart(Activity activity) {}
	@Override public void onPause(Activity activity) {}
	@Override public void onDestroy(Activity activity) {}

	@Override
	public void release()
	{
		// Release search bar if there is one
		if (nativeView instanceof RelativeLayout) {
			((RelativeLayout) nativeView).removeAllViews();
			TiViewProxy searchView = (TiViewProxy) (proxy.getProperty(TiC.PROPERTY_SEARCH));
			searchView.release();
		}

		if (tableView != null) {
			tableView.release();
			tableView  = null;
		}
		if (proxy != null && proxy.getActivity() != null) {
			((TiBaseActivity)proxy.getActivity()).removeOnLifecycleEventListener(this);
		}
		nativeView  = null;
		super.release();
	}

	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue, KrollProxy proxy)
	{
		if (DBG) {
			Log.d(LCAT, "Property: " + key + " old: " + oldValue + " new: " + newValue);
		}
		if (key.equals(TiC.PROPERTY_SEPARATOR_COLOR)) {
			tableView.setSeparatorColor(TiConvert.toString(newValue));
		} else {
			super.propertyChanged(key, oldValue, newValue, proxy);
		}
	}

	@Override
	public void registerForTouch() {
		registerForTouch(tableView.getListView());
	}
}

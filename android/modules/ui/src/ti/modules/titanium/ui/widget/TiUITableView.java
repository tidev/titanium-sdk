/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget;

import java.util.concurrent.Semaphore;

import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.TiProxy;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiUIView;
import org.json.JSONObject;

import ti.modules.titanium.ui.TableViewProxy;
import ti.modules.titanium.ui.widget.searchbar.TiUISearchBar;
import ti.modules.titanium.ui.widget.tableview.TableViewModel;
import ti.modules.titanium.ui.widget.tableview.TiTableView;
import ti.modules.titanium.ui.widget.tableview.TiTableView.OnItemClickedListener;
import android.graphics.ColorFilter;
import android.os.Handler;
import android.view.Gravity;
import android.widget.ListView;
import android.widget.RelativeLayout;

public class TiUITableView extends TiUIView
	implements OnItemClickedListener
//	implements  Handler.Callback
{
	private static final String LCAT = "TitaniumTableView";	
	private static final boolean DBG = TiConfig.LOGD;
	private static final String EVENT_CLICK = "click";
	
	private String callback;
	private String searchBarName;
	private TiUISearchBar searchBar;
	private Semaphore modifySemaphore;
	private Handler handler;
	private boolean hasSearch = false;
	private TiTableView tableView;

	class IndexedItem {
		int position;
		JSONObject item;
	}

	class IndexHolder extends Semaphore {
		private static final long serialVersionUID = 1L;
		public IndexHolder() {
			super(0);
		}
		public int index;
	}

	public TiUITableView(TiViewProxy proxy/*, int themeId*/)
	{
		super(proxy);
		getLayoutParams().autoFillsHeight = true;
		getLayoutParams().autoFillsWidth = true;

		this.modifySemaphore = new Semaphore(0);
		//this.hasBeenOpened = false;
	}

	@Override
	public void onClick(TiDict data) {
		proxy.fireEvent(EVENT_CLICK, data);
	}
	
	public void setModelDirty() {
		tableView.getTableViewModel().setDirty();
	}
	
	public TableViewModel getModel() {
		return tableView.getTableViewModel();
	}
	
	public void updateView() {
		tableView.dataSetChanged();
	}	

	public void scrollToIndex(final int index) {
		tableView.getListView().setSelection(index);
	}

	@Override
	public void processProperties(TiDict d)
	{
		tableView = new TiTableView(proxy.getTiContext(), (TableViewProxy) proxy);
		tableView.setOnItemClickListener(this);
	
		if (d.containsKey("search")) {
			RelativeLayout layout = new RelativeLayout(proxy.getTiContext().getActivity());
			layout.setGravity(Gravity.NO_GRAVITY);
			layout.setPadding(0, 0, 0, 0);
			
			TiViewProxy searchView = (TiViewProxy) d.get("search");
			TiUISearchBar searchBar = (TiUISearchBar)searchView.getView(proxy.getTiContext().getActivity());
			searchBar.setOnSearchChangeListener(tableView);
			searchBar.getNativeView().setId(102);
			
			RelativeLayout.LayoutParams p = new RelativeLayout.LayoutParams(
					RelativeLayout.LayoutParams.FILL_PARENT,
					RelativeLayout.LayoutParams.FILL_PARENT);
			p.addRule(RelativeLayout.ALIGN_PARENT_TOP);
			p.addRule(RelativeLayout.ALIGN_PARENT_LEFT);
			p.addRule(RelativeLayout.ALIGN_PARENT_RIGHT);
			p.height = 52;
			
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
			hasSearch = true;
		} else {
			setNativeView(tableView);
		}
		
		if (d.containsKey("filterAttribute")) {
			tableView.setFilterAttribute(TiConvert.toString(d, "filterAttribute"));
		}
		
		boolean filterCaseInsensitive = true;
		if (d.containsKey("filterCaseInsensitive")) {
			filterCaseInsensitive = TiConvert.toBoolean(d, "filterCaseInsensitive");
		}
		tableView.setFilterCaseInsensitive(filterCaseInsensitive);
		
//		if (d.containsKey("data")) {
//			tv.setData((Object[]) d.get("data"));
//		}
//		if (d.containsKey("rowHeight")) {
//			tv.setRowHeight(d.getString("rowHeight"));
//		}
//		if (d.containsKey("fontSize")) {
//			tv.setFontSize(d.get("fontSize"));
//		}
//		if (d.containsKey("fontWeight")) {
//			tv.setFontWeight(d.get("fontWeight"));
//		}
//		if (d.containsKey("marginLeft")) {
//			tv.setOption("marginLeft", d.get("marginLeft"));
//		}
//		if (d.containsKey("marginTop")) {
//			tv.setOption("marginTop", d.get("marginTop"));
//		}
//		if (d.containsKey("marginRight")) {
//			tv.setOption("marginRight", d.get("marginRight"));
//		}
//		if (d.containsKey("marginBottom")) {
//			tv.setOption("marginBottom", d.get("marginBottom"));
//		}
//		if (d.containsKey("scrollBar")) {
//			tv.setOption("scrollBar", d.get("scrollBar"));
//		}
//		if (d.containsKey("searchInstance")) {
//			tv.searchBarName = d.get("searchInstance");
//		}
//		if (d.containsKey("filterAttribute")) {
//			tv.filterAttribute = d.get("filterAttribute");
//		}
//		if (d.containsKey("textAlign")) {
//			tv.setOption("textAlign", d.get("textAlign"));
//		}

		super.processProperties(d);
	}
	
	

//	public void processLocalOptions(JSONObject o) throws JSONException
//	{
//		if (o.has("template")) {
//			setTemplate(o.getString("template"));
//		}
//		if (o.has("data")) {
//			setData(o.getString("data"));
//		}
//		if (o.has("rowHeight")) {
//			setRowHeight(o.getString("rowHeight"));
//		}
//		if (o.has("fontSize")) {
//			setFontSize(o.getString("fontSize"));
//		}
//		if (o.has("fontWeight")) {
//			setFontWeight(o.getString("fontWeight"));
//		}
//		if (o.has("marginLeft")) {
//			setOption("marginLeft", o.getString("marginLeft"));
//		}
//		if (o.has("marginTop")) {
//			setOption("marginTop", o.getString("marginTop"));
//		}
//		if (o.has("marginRight")) {
//			setOption("marginRight", o.getString("marginRight"));
//		}
//		if (o.has("marginBottom")) {
//			setOption("marginBottom", o.getString("marginBottom"));
//		}
//		if (o.has("scrollBar")) {
//			setOption("scrollBar", o.getString("scrollBar"));
//		}
//		if (o.has("searchInstance")) {
//			searchBarName = o.getString("searchInstance");
//		}
//		if (o.has("filterAttribute")) {
//			filterAttribute = o.getString("filterAttribute");
//		}
//		if (o.has("textAlign")) {
//			setOption("textAlign", o.getString("textAlign"));
//		}
//	}
//
//	public void scrollToIndex(int index, String options) {
//		handler.obtainMessage(MSG_SCROLLTOINDEX, index, -1, options).sendToTarget();
//	}

//	public void doScrollToIndex(int index, JSONObject options) {
//		int position = viewModel.getViewIndex(index);
//		if (position < 0) {
//			return;
//		}
//		int localRowHeight = viewModel.getRowHeight(position, Integer.parseInt(defaults.get("rowHeight")));
//		int offset = 0;
//
//		if (options != null) {
//			int viewpos = 0; // Titanium.UI.TABLEVIEW_POSITION_ANY
//			int padding = 10;
//			try {
//				if (options.has("position")) {
//					viewpos = options.getInt("position");
//				}
//				if (options.has("padding")) {
//					padding = options.getInt("padding");
//				}
//			} catch (JSONException e) {
//				Log.w(LCAT, "Unable to get position from JSON obect, using ANY/0");
//			}
//
//			if (viewpos == 0) {
//				if (position < listView.getFirstVisiblePosition()) {
//					viewpos = 1;
//				} else if (position > listView.getLastVisiblePosition()) {
//					viewpos = 3;
//				}
//			}
//
//			switch(viewpos) {
//				case 1 : // Titanium.UI.TABLEVIEW_POSITION_TOP
//					offset = 0;
//					if (position > 0) {
//						offset = padding;
//					}
//					break;
//				case 2 : // Titanium.UI.TABLEVIEW_POSITION_MIDDLE
//					offset = (getHeight()/2) - (localRowHeight/2);
//					break;
//				case 3 : // Titanium.UI.TABLEVIEW_POSITION_BOTTOM
//					offset = getHeight() - localRowHeight - padding;
//					break;
//				default:
//					offset = -1;
//			}
//		}
//		if (offset != -1) {
//			listView.setSelectionFromTop(position, offset);
//		}
//	}


	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue,
			TiProxy proxy) {
		if (DBG) {
			Log.d(LCAT, "Property: " + key + " old: " + oldValue + " new: " + newValue);
		}
		if (key.equals("separatorColor")) {
			tableView.setSeparatorColor(TiConvert.toString(newValue));			
		} else {
			super.propertyChanged(key, oldValue, newValue, proxy);
		}
	}
	
	private void acquireModifySemaphore() {
		try {
			modifySemaphore.acquire();
		} catch (InterruptedException ig) {
			// Ignore;
		}
	}
	private void releaseModifySemaphore() {
		modifySemaphore.release();
	}

//	protected void doOpen()
//	{
//		FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(LayoutParams.FILL_PARENT, LayoutParams.FILL_PARENT);
//		setLayoutParams(params);
//		setFocusable(false);
//		setFocusableInTouchMode(false);
//		final String callback = this.callback;
//
//		if (searchBarName != null) {
//			Object o = proxy.getInstanceForName(searchBarName);
//			if (o != null && o instanceof TitaniumSearchBar) {
//				searchBar = (TitaniumSearchBar) o;
//				searchBar.control.setId(100);
//				searchBar.setOnSearchChangeListener(new OnSearchChangeListener(){
//
//					public void filterBy(String s) {
//						filterText = s;
//						adapter.applyFilter();
//						handler.post(dataSetChanged);
//					}});
//			}
//		}
//
//
//
//		String scrollBar = defaults.get("scrollBar");
//		if (scrollBar.equals("true")) {
//			listView.setVerticalScrollBarEnabled(true);
//		} else if (scrollBar.equals("false")) {
//			listView.setVerticalScrollBarEnabled(false);
//		} else {
//			int margin = defaults.getIntOption("marginLeft") + defaults.getIntOption("marginTop") +
//			defaults.getIntOption("marginRight") + defaults.getIntOption("marginBottom");
//			listView.setVerticalScrollBarEnabled(margin > 0 ? false : true);
//		}



//		if (searchBar != null) {
//			view = new RelativeLayout(proxy.getContext());
//			view.setPadding(4,2,4,2);
//			view.setGravity(Gravity.NO_GRAVITY);
//
//			RelativeLayout.LayoutParams p = new RelativeLayout.LayoutParams(LayoutParams.FILL_PARENT, LayoutParams.FILL_PARENT);
//			p.addRule(RelativeLayout.ALIGN_PARENT_TOP);
//			p.addRule(RelativeLayout.ALIGN_PARENT_LEFT);
//			p.addRule(RelativeLayout.ALIGN_PARENT_RIGHT);
//			p.height = 52;
//
//			view.addView(searchBar.control, p);
//
//			p = new RelativeLayout.LayoutParams(LayoutParams.FILL_PARENT, LayoutParams.FILL_PARENT);
//			p.addRule(RelativeLayout.ALIGN_PARENT_LEFT);
//			p.addRule(RelativeLayout.ALIGN_PARENT_BOTTOM);
//			p.addRule(RelativeLayout.ALIGN_PARENT_RIGHT);
//			p.addRule(RelativeLayout.BELOW, 100);
//
//			view.addView(listView, p);
//		}
//	}

//	@Override
//	public boolean onKeyDown(int keyCode, KeyEvent event) {
//		boolean handled = super.onKeyDown(keyCode, event);
//		if (! handled) {
//			handled = listView.onKeyDown(keyCode, event);
//		}
//		return handled;
//	}
//
//	public void filterView(String filterText) {
//		this.filterText = filterText;
//		handler.post(dataSetChanged);
//	}
//
//	public void setFilterAttribute(String attribute) {
//		this.filterAttribute = attribute;
//		handler.post(dataSetChanged);
//	}
//
//	public void setOption(String key, String value) {
//		defaults.put(key, value);
//	}
}

/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget;

import java.util.concurrent.Semaphore;

import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.view.TiUIView;
import org.json.JSONObject;

import ti.modules.titanium.ui.widget.searchbar.TiUISearchBar;
import ti.modules.titanium.ui.widget.tableview.TiTableView;
import ti.modules.titanium.ui.widget.tableview.TiTableView.OnItemClickedListener;
import android.os.Handler;
import android.widget.RelativeLayout;

public class TiUITableView extends TiUIView
	implements OnItemClickedListener
//	implements  Handler.Callback
{
	private static final String LCAT = "TitaniumTableView";

	private static final String EVENT_CLICK = "click";

	private static final int MSG_SETDATA = 302;
	private static final int MSG_DELETEROW = 303;
	private static final int MSG_UPDATEROW = 304;
	private static final int MSG_INSERTBEFORE = 305;
	private static final int MSG_INSERTAFTER = 306;
	private static final int MSG_INDEXBYNAME = 307;
	private static final int MSG_SCROLLTOINDEX = 308;
	private static final int MSG_SET_TEMPLATE = 309;

	private String callback;
	private String searchBarName;
	private TiUISearchBar searchBar;
	private RelativeLayout view;
	private Semaphore modifySemaphore;
	private Handler handler;


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
		TiTableView tv = new TiTableView(proxy.getContext());
		tv.setOnItemClickListener(this);
		setNativeView(tv);
		//this.hasBeenOpened = false;
	}

	@Override
	public void onClick(TiDict data) {
		proxy.fireEvent(EVENT_CLICK, data);
	}

	private TiTableView getView() {
		return (TiTableView) getNativeView();
	}

	@Override
	public void processProperties(TiDict d)
	{
		TiTableView tv = getView();

		if (d.containsKey("template")) {
			tv.setTemplate(d.getTiDict("template"));
		}
		if (d.containsKey("data")) {
			tv.setData((Object[]) d.get("data"));
		}
		if (d.containsKey("rowHeight")) {
			tv.setRowHeight(d.getString("rowHeight"));
		}
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
//	public void setTemplate(String template) {
//		try {
//			JSONObject t = new JSONObject(template);
//			handler.obtainMessage(MSG_SET_TEMPLATE, t).sendToTarget();
//			acquireModifySemaphore();
//		} catch (JSONException e) {
//			Log.e(LCAT, "Unable to load template: " + e.getMessage(), e);
//		}
//	}
//
//	public void doSetTemplate(JSONObject template) {
//		this.rowTemplate = template;
//	}
//
//	public void setData(String data) {
//		handler.obtainMessage(MSG_SETDATA, data).sendToTarget();
//		acquireModifySemaphore();
//	}
//
//	public void doSetData(String data) {
//		viewModel.setData(data);
//		handler.post(dataSetChanged);
//	}
//
//	public void deleteRow(int index) {
//		handler.obtainMessage(MSG_DELETEROW, index, -1).sendToTarget();
//		acquireModifySemaphore();
//	}
//
//	public void doDeleteRow(int index) {
//		viewModel.deleteItem(index);
//		handler.post(dataSetChanged);
//	}
//
//	public void insertRowAfter(int index, String json) {
//		handler.obtainMessage(MSG_INSERTAFTER, index, -1, json).sendToTarget();
//		acquireModifySemaphore();
//	}
//
//	public void doInsertRowAfter(int index, String json) {
//		try {
//			viewModel.insertItemAfter(index, new JSONObject(json));
//			handler.post(dataSetChanged);
//		} catch (JSONException e) {
//			Log.e(LCAT, "Error trying to insert row: ", e);
//		}
//	}
//
//	public void insertRowBefore(int index, String json) {
//		handler.obtainMessage(MSG_INSERTBEFORE, index, -1, json).sendToTarget();
//		acquireModifySemaphore();
//}
//
//	public void doInsertRowBefore(int index, String json) {
//		try {
//			viewModel.insertItemBefore(index, new JSONObject(json));
//			handler.post(dataSetChanged);
//		} catch (JSONException e) {
//			Log.e(LCAT, "Error trying to insert row: ", e);
//		}
//	}
//
//	public void updateRow(int index, String json) {
//		handler.obtainMessage(MSG_UPDATEROW, index, -1, json).sendToTarget();
//		acquireModifySemaphore();
//}
//
//	public void doUpdateRow(int index, String json) {
//		try {
//			viewModel.updateItem(index, new JSONObject(json));
//			handler.post(dataSetChanged);
//		} catch (JSONException e) {
//			Log.e(LCAT, "Error trying to update row: ", e);
//		}
//	}
//
//	public void appendRow(String rowData, String json) {
//		insertRowAfter(viewModel.getRowCount()-1, rowData);
//	}
//
//	public int getRowCount() {
//		return viewModel.getRowCount();
//	}
//
//	public int getIndexByName(String name) {
//		IndexHolder h = new IndexHolder();
//		h.index = -1;
//
//		Message m = handler.obtainMessage(MSG_INDEXBYNAME, h);
//		m.getData().putString("name", name);
//		m.sendToTarget();
//
//		try {
//			h.acquire();
//		} catch (InterruptedException e) {
//			Log.w(LCAT, "Interrupted while waiting for index.");
//		}
//		return h.index;
//	}
//	public int doGetIndexByName(String name) {
//		return viewModel.getIndexByName(name);
//	}
//
//	public void setRowHeight(String height) {
//		defaults.put("rowHeight", height);
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

//	public boolean handleMessage(Message msg)
//	{
//		boolean handled = false;
//
//		if (!handled) {
//			switch(msg.what) {
//			case MSG_SETDATA:
//				doSetData((String) msg.obj);
//				releaseModifySemaphore();
//				return true;
//			case MSG_DELETEROW:
//				doDeleteRow(msg.arg1);
//				releaseModifySemaphore();
//				return true;
//			case MSG_INSERTAFTER:
//				doInsertRowAfter(msg.arg1, (String) msg.obj);
//				releaseModifySemaphore();
//				return true;
//			case MSG_INSERTBEFORE:
//				doInsertRowBefore(msg.arg1, (String) msg.obj);
//				releaseModifySemaphore();
//				return true;
//			case MSG_UPDATEROW:
//				doUpdateRow(msg.arg1, (String) msg.obj);
//				releaseModifySemaphore();
//				return true;
//			case MSG_INDEXBYNAME :
//				IndexHolder h = (IndexHolder) msg.obj;
//				String name = msg.getData().getString("name");
//				h.index = doGetIndexByName(name);
//				h.release();
//				return true;
//			case MSG_SCROLLTOINDEX :
//				JSONObject options = null;
//				try {
//					options = new JSONObject((String) msg.obj);
//				} catch (Exception e) {
//					Log.w(LCAT, "Error converting options to JSON: " + msg.obj);
//				}
//				doScrollToIndex(msg.arg1, options);
//				return true;
//			case MSG_SET_TEMPLATE :
//				doSetTemplate((JSONObject) msg.obj);
//				releaseModifySemaphore();
//				return true;
//			}
//		}
//		return false;
//	}

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

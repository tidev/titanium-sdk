/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.module.ui;

import java.util.concurrent.Semaphore;

import org.appcelerator.titanium.TitaniumModuleManager;
import org.appcelerator.titanium.api.ITitaniumLifecycle;
import org.appcelerator.titanium.api.ITitaniumTableView;
import org.appcelerator.titanium.module.ui.searchbar.TitaniumSearchBar;
import org.appcelerator.titanium.module.ui.tableview.TableViewModel;
import org.appcelerator.titanium.module.ui.tableview.TitaniumBaseTableViewItem;
import org.appcelerator.titanium.module.ui.tableview.TitaniumTableViewCustomItem;
import org.appcelerator.titanium.module.ui.tableview.TitaniumTableViewHeaderItem;
import org.appcelerator.titanium.module.ui.tableview.TitaniumTableViewHtmlItem;
import org.appcelerator.titanium.module.ui.tableview.TitaniumTableViewItemOptions;
import org.appcelerator.titanium.module.ui.tableview.TitaniumTableViewNormalItem;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TitaniumUIHelper;
import org.json.JSONException;
import org.json.JSONObject;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Rect;
import android.graphics.drawable.ColorDrawable;
import android.graphics.drawable.Drawable;
import android.os.Handler;
import android.os.Message;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.View;
import android.view.ViewGroup;
import android.widget.AdapterView;
import android.widget.BaseAdapter;
import android.widget.FrameLayout;
import android.widget.ListView;
import android.widget.RelativeLayout;
import android.widget.AdapterView.OnItemClickListener;

public class TitaniumTableView extends TitaniumBaseView
	implements ITitaniumTableView, Handler.Callback
{
	private static final String LCAT = "TitaniumTableView";

	public static final int TYPE_HEADER = 0;
	public static final int TYPE_NORMAL = 1;
	public static final int TYPE_HTML = 2;
	public static final int TYPE_CUSTOM = 3;

	private static final int MSG_SETDATA = 302;
	private static final int MSG_DELETEROW = 303;
	private static final int MSG_UPDATEROW = 304;
	private static final int MSG_INSERTBEFORE = 305;
	private static final int MSG_INSERTAFTER = 306;
	private static final int MSG_INDEXBYNAME = 307;
	private static final int MSG_SCROLLTOINDEX = 308;
	private static final int MSG_SET_TEMPLATE = 309;

	private String callback;
	private TableViewModel viewModel;
	private TTVListAdapter adapter;
	private ListView listView;
	private JSONObject rowTemplate;
	private TitaniumTableViewItemOptions defaults;
	private String searchBarName;
	private TitaniumSearchBar searchBar;
	private String filterAttribute;
	private RelativeLayout view;

	private Runnable dataSetChanged = new Runnable() {

		public void run() {
			if (adapter != null) {
				adapter.notifyDataSetChanged();
			}
		}

	};

	class TTVListAdapter extends BaseAdapter
	{
		TableViewModel viewModel;

		TTVListAdapter(TableViewModel viewModel) {
			this.viewModel = viewModel;
		}

		public int getCount() {
			return viewModel.getViewModel().length();
		}

		public Object getItem(int position) {
			JSONObject o = null;
			try {
				o = viewModel.getViewModel().getJSONObject(position);
			} catch (JSONException e) {
				Log.w(LCAT, "Error while getting JSON object at " + position, e);
			}
			return o;
		}

		public long getItemId(int position) {
			// TODO Auto-generated method stub
			return 0;
		}

		@Override
		public int getViewTypeCount() {
			return 4;
		}

		@Override
		public int getItemViewType(int position) {
			JSONObject o = (JSONObject) getItem(position);
			return typeForItem(o);
		}

		private int typeForItem(JSONObject o) {
			if (o.optBoolean("isDisplayHeader", false)) {
				return TYPE_HEADER;
			} else if ((o.has("layout") && !o.isNull("layout")) || (rowTemplate != null && !o.has("layout"))) {
				return TYPE_CUSTOM;
			} else if (o.has("html")) {
				return TYPE_HTML;
			} else {
				return TYPE_NORMAL;
			}
		}

		public View getView(int position, View convertView, ViewGroup parent)
		{
			JSONObject o = (JSONObject) getItem(position);
			TitaniumBaseTableViewItem v = null;

			if (convertView != null) {
				v = (TitaniumBaseTableViewItem) convertView;
			} else {
				Context ctx = tmm.getAppContext();
				switch(typeForItem(o)) {
				case TYPE_HEADER :
					v = new TitaniumTableViewHeaderItem(ctx);
					break;
				case TYPE_NORMAL :
					v = new TitaniumTableViewNormalItem(ctx);
					break;
				case TYPE_HTML :
					v = new TitaniumTableViewHtmlItem(ctx);
					break;
				case TYPE_CUSTOM:
					v = new TitaniumTableViewCustomItem(ctx);
					break;
				}
			}

			v.setRowData(defaults, rowTemplate, o);
			return v;
		}

		@Override
		public boolean areAllItemsEnabled() {
			return false;
		}

		@Override
		public boolean isEnabled(int position) {
			boolean enabled = true;
			JSONObject o = (JSONObject) getItem(position);
			try {
				enabled = !o.getBoolean("isDisplayHeader");
			} catch (JSONException e) {
				Log.w(LCAT, "Missing isDisplayHeader attribute at position " + position);
			}
			return enabled;
		}

		@Override
		public boolean hasStableIds() {
			return false;
		}
	}

	class IndexHolder extends Semaphore {
		private static final long serialVersionUID = 1L;
		public IndexHolder() {
			super(0);
		}
		public int index;
	}

	public TitaniumTableView(TitaniumModuleManager tmm, int themeId)
	{
		super(tmm, themeId);

		this.defaults = new TitaniumTableViewItemOptions();
		defaults.put("rowHeight", "43");
		defaults.put("fontSize", TitaniumUIHelper.getDefaultFontSize(tmm.getActivity()));
		defaults.put("fontWeight", TitaniumUIHelper.getDefaultFontWeight(tmm.getActivity()));
		defaults.put("marginLeft", "0");
		defaults.put("marginTop", "0");
		defaults.put("marginRight", "0");
		defaults.put("marginBottom", "0");
		defaults.put("scrollBar", "auto");

		this.viewModel = new TableViewModel();
		this.hasBeenOpened = false;
	}

	public void processLocalOptions(JSONObject o) throws JSONException
	{
		if (o.has("template")) {
			setTemplate(o.getString("template"));
		}
		if (o.has("data")) {
			setData(o.getString("data"));
		}
		if (o.has("rowHeight")) {
			setRowHeight(o.getString("rowHeight"));
		}
		if (o.has("fontSize")) {
			setFontSize(o.getString("fontSize"));
		}
		if (o.has("fontWeight")) {
			setFontWeight(o.getString("fontWeight"));
		}
		if (o.has("marginLeft")) {
			setOption("marginLeft", o.getString("marginLeft"));
		}
		if (o.has("marginTop")) {
			setOption("marginTop", o.getString("marginTop"));
		}
		if (o.has("marginRight")) {
			setOption("marginRight", o.getString("marginRight"));
		}
		if (o.has("marginBottom")) {
			setOption("marginBottom", o.getString("marginBottom"));
		}
		if (o.has("scrollBar")) {
			setOption("scrollBar", o.getString("scrollBar"));
		}
		if (o.has("searchInstance")) {
			searchBarName = o.getString("searchInstance");
		}
		if (o.has("filterAttribute")) {
			filterAttribute = o.getString("filterAttribute");
		}
	}

	public void setTemplate(String template) {
		try {
			JSONObject t = new JSONObject(template);
			handler.obtainMessage(MSG_SET_TEMPLATE, t).sendToTarget();
		} catch (JSONException e) {
			Log.e(LCAT, "Unable to load template: " + e.getMessage(), e);
		}
	}

	public void doSetTemplate(JSONObject template) {
		this.rowTemplate = template;
	}

	public void setData(String data) {
		handler.obtainMessage(MSG_SETDATA, data).sendToTarget();
	}

	public void doSetData(String data) {
		viewModel.setData(data);
		handler.post(dataSetChanged);
	}

	public void deleteRow(int index) {
		handler.obtainMessage(MSG_DELETEROW, index, -1).sendToTarget();
	}

	public void doDeleteRow(int index) {
		viewModel.deleteItem(index);
		handler.post(dataSetChanged);
	}

	public void insertRowAfter(int index, String json) {
		handler.obtainMessage(MSG_INSERTAFTER, index, -1, json).sendToTarget();
	}

	public void doInsertRowAfter(int index, String json) {
		try {
			viewModel.insertItemAfter(index, new JSONObject(json));
			handler.post(dataSetChanged);
		} catch (JSONException e) {
			Log.e(LCAT, "Error trying to insert row: ", e);
		}
	}

	public void insertRowBefore(int index, String json) {
		handler.obtainMessage(MSG_INSERTBEFORE, index, -1, json).sendToTarget();
	}

	public void doInsertRowBefore(int index, String json) {
		try {
			viewModel.insertItemBefore(index, new JSONObject(json));
			handler.post(dataSetChanged);
		} catch (JSONException e) {
			Log.e(LCAT, "Error trying to insert row: ", e);
		}
	}

	public void updateRow(int index, String json) {
		handler.obtainMessage(MSG_UPDATEROW, index, -1, json).sendToTarget();
	}

	public void doUpdateRow(int index, String json) {
		try {
			viewModel.updateItem(index, new JSONObject(json));
			handler.post(dataSetChanged);
		} catch (JSONException e) {
			Log.e(LCAT, "Error trying to update row: ", e);
		}
	}

	public void appendRow(String rowData, String json) {
		insertRowAfter(viewModel.getRowCount()-1, rowData);
	}

	public int getRowCount() {
		return viewModel.getRowCount();
	}

	public int getIndexByName(String name) {
		IndexHolder h = new IndexHolder();
		h.index = -1;

		Message m = handler.obtainMessage(MSG_INDEXBYNAME, h);
		m.getData().putString("name", name);
		m.sendToTarget();

		try {
			h.acquire();
		} catch (InterruptedException e) {
			Log.w(LCAT, "Interrupted while waiting for index.");
		}
		return h.index;
	}
	public int doGetIndexByName(String name) {
		return viewModel.getIndexByName(name);
	}

	public void setRowHeight(String height) {
		defaults.put("rowHeight", height);
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public void scrollToIndex(int index, String options) {
		handler.obtainMessage(MSG_SCROLLTOINDEX, index, -1, options).sendToTarget();
	}

	public void doScrollToIndex(int index, JSONObject options) {
		int position = viewModel.getViewIndex(index);
		if (position < 0) {
			return;
		}
		int localRowHeight = viewModel.getRowHeight(position, Integer.parseInt(defaults.get("rowHeight")));
		int offset = 0;

		if (options != null) {
			int viewpos = 0; // Titanium.UI.TABLEVIEW_POSITION_ANY
			int padding = 10;
			try {
				if (options.has("position")) {
					viewpos = options.getInt("position");
				}
				if (options.has("padding")) {
					padding = options.getInt("padding");
				}
			} catch (JSONException e) {
				Log.w(LCAT, "Unable to get position from JSON obect, using ANY/0");
			}

			if (viewpos == 0) {
				if (position < listView.getFirstVisiblePosition()) {
					viewpos = 1;
				} else if (position > listView.getLastVisiblePosition()) {
					viewpos = 3;
				}
			}

			switch(viewpos) {
				case 1 : // Titanium.UI.TABLEVIEW_POSITION_TOP
					offset = 0;
					if (position > 0) {
						offset = padding;
					}
					break;
				case 2 : // Titanium.UI.TABLEVIEW_POSITION_MIDDLE
					offset = (getHeight()/2) - (localRowHeight/2);
					break;
				case 3 : // Titanium.UI.TABLEVIEW_POSITION_BOTTOM
					offset = getHeight() - localRowHeight - padding;
					break;
				default:
					offset = -1;
			}
		}
		if (offset != -1) {
			listView.setSelectionFromTop(position, offset);
		}
	}

	public boolean isPrimary() {
		//return root;
		return true;
	}

	public boolean handleMessage(Message msg)
	{
		boolean handled = super.handleMessage(msg);

		if (!handled) {
			switch(msg.what) {
			case MSG_SETDATA:
				doSetData((String) msg.obj);
				return true;
			case MSG_DELETEROW:
				doDeleteRow(msg.arg1);
				return true;
			case MSG_INSERTAFTER:
				doInsertRowAfter(msg.arg1, (String) msg.obj);
				return true;
			case MSG_INSERTBEFORE:
				doInsertRowBefore(msg.arg1, (String) msg.obj);
				return true;
			case MSG_UPDATEROW:
				doUpdateRow(msg.arg1, (String) msg.obj);
				return true;
			case MSG_INDEXBYNAME :
				IndexHolder h = (IndexHolder) msg.obj;
				String name = msg.getData().getString("name");
				h.index = doGetIndexByName(name);
				h.release();
				return true;
			case MSG_SCROLLTOINDEX :
				JSONObject options = null;
				try {
					options = new JSONObject((String) msg.obj);
				} catch (Exception e) {
					Log.w(LCAT, "Error converting options to JSON: " + msg.obj);
				}
				doScrollToIndex(msg.arg1, options);
				return true;
			case MSG_SET_TEMPLATE :
				doSetTemplate((JSONObject) msg.obj);
				return true;
			}
		}
		return false;
	}

	public void setCallback(final String callback)
	{
		this.callback = callback;
	}


	protected void doOpen()
	{
		FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(LayoutParams.FILL_PARENT, LayoutParams.FILL_PARENT);
		setLayoutParams(params);
		setFocusable(false);
		setFocusableInTouchMode(false);
		final String callback = this.callback;

		if (searchBarName != null) {
			Object o = tmm.getInstanceForName(searchBarName);
			if (o != null && o instanceof TitaniumSearchBar) {
				searchBar = (TitaniumSearchBar) o;
				searchBar.control.setId(100);
			}
		}

		this.listView = new ListView(getContext()) {

			@Override
			public boolean dispatchKeyEvent(KeyEvent event) {
				return super.dispatchKeyEvent(event);
			}
		};

		listView.setId(101);

		final Drawable defaultSelector = listView.getSelector();
		final Drawable adaptableSelector = new ColorDrawable(Color.TRANSPARENT) {

			@Override
			public void draw(Canvas canvas) {
				TitaniumBaseTableViewItem v = (TitaniumBaseTableViewItem) listView.getSelectedView();
				boolean customTable = rowTemplate != null;

				if (customTable || v != null) {
					if (customTable || v.providesOwnSelector()) {
						super.draw(canvas);
					} else {
						Rect r = getBounds();
						defaultSelector.setBounds(r);
						defaultSelector.setState(listView.getDrawableState());
						defaultSelector.draw(canvas);
					}
				} else {
					Rect r = getBounds();
					defaultSelector.setBounds(r);
					defaultSelector.setState(listView.getDrawableState());
					defaultSelector.draw(canvas);
				}
			}

		};
		listView.setSelector(adaptableSelector);

		listView.setFocusable(true);
		listView.setFocusableInTouchMode(true);
		listView.setBackgroundColor(Color.TRANSPARENT);
		listView.setCacheColorHint(Color.TRANSPARENT);
		adapter = new TTVListAdapter(viewModel);
		listView.setAdapter(adapter);

		String scrollBar = defaults.get("scrollBar");
		if (scrollBar.equals("true")) {
			listView.setVerticalScrollBarEnabled(true);
		} else if (scrollBar.equals("false")) {
			listView.setVerticalScrollBarEnabled(false);
		} else {
			int margin = defaults.getIntOption("marginLeft") + defaults.getIntOption("marginTop") +
			defaults.getIntOption("marginRight") + defaults.getIntOption("marginBottom");
			listView.setVerticalScrollBarEnabled(margin > 0 ? false : true);
		}

		listView.setOnItemClickListener(new OnItemClickListener() {

			public void onItemClick(AdapterView<?> parent, View view, int position, long id)
			{
				TitaniumBaseTableViewItem v = (TitaniumBaseTableViewItem) view;
				String viewClicked = v.getLastClickedViewName();

				try {
					JSONObject item = viewModel.getViewModel().getJSONObject(position);
					JSONObject event = new JSONObject();

					event.put("rowData", item);
					event.put("section", item.getInt("section"));
					event.put("row", item.getInt("sectionIndex"));
					event.put("index", item.getInt("index"));
					event.put("detail", false);
					if (item.has("name")) {
						event.put("name", item.getString("name"));
					}

					if (viewClicked != null) {
						event.put("layoutName", viewClicked);
					}

					if (callback != null) {
						tmm.getWebView().evalJS(callback, event);
					}

				} catch (JSONException e) {
					Log.e(LCAT, "Error handling event at position: " + position);
				}
			}});


		if (searchBar != null) {
			view = new RelativeLayout(getContext());
			view.setPadding(4,2,4,2);
			view.setGravity(Gravity.NO_GRAVITY);

			RelativeLayout.LayoutParams p = new RelativeLayout.LayoutParams(LayoutParams.FILL_PARENT, LayoutParams.FILL_PARENT);
			p.addRule(RelativeLayout.ALIGN_PARENT_TOP);
			p.addRule(RelativeLayout.ALIGN_PARENT_LEFT);
			p.addRule(RelativeLayout.ALIGN_PARENT_RIGHT);
			p.height = 52;

			view.addView(searchBar.control, p);

			p = new RelativeLayout.LayoutParams(LayoutParams.FILL_PARENT, LayoutParams.FILL_PARENT);
			p.addRule(RelativeLayout.ALIGN_PARENT_LEFT);
			p.addRule(RelativeLayout.ALIGN_PARENT_BOTTOM);
			p.addRule(RelativeLayout.ALIGN_PARENT_RIGHT);
			p.addRule(RelativeLayout.BELOW, 100);

			view.addView(listView, p);
		}
	}

	@Override
	public boolean onKeyDown(int keyCode, KeyEvent event) {
		boolean handled = super.onKeyDown(keyCode, event);
		if (! handled) {
			handled = listView.onKeyDown(keyCode, event);
		}
		return handled;
	}

	@Override
	protected View getContentView() {

		return (searchBar != null) ? view : listView;
	}

	@Override
	protected LayoutParams getContentLayoutParams() {
		FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(LayoutParams.FILL_PARENT, LayoutParams.FILL_PARENT);
		params.gravity = Gravity.NO_GRAVITY;
		params.leftMargin = defaults.getIntOption("marginLeft");
		params.topMargin = defaults.getIntOption("marginTop");
		params.rightMargin = defaults.getIntOption("marginRight");
		params.bottomMargin = defaults.getIntOption("marginBottom");
		return params;
	}

	public void setFontSize(String fontSize) {
		defaults.put("fontSize", fontSize);
	}

	public void setFontWeight(String fontWeight) {
		defaults.put("fontWeight", fontWeight);
	}

	public void setOption(String key, String value) {
		defaults.put(key, value);
	}

	public void close()
	{
		handler.sendEmptyMessage(MSG_CLOSE);
	}

	public ITitaniumLifecycle getLifecycle() {
		return null;
	}
}

package org.appcelerator.titanium.module.ui;

import org.appcelerator.titanium.TitaniumModuleManager;
import org.appcelerator.titanium.api.ITitaniumLifecycle;
import org.appcelerator.titanium.api.ITitaniumTableView;
import org.appcelerator.titanium.api.ITitaniumView;
import org.appcelerator.titanium.module.ui.tableview.TableViewModel;
import org.appcelerator.titanium.util.Log;
import org.json.JSONException;
import org.json.JSONObject;

import android.content.res.Configuration;
import android.os.Bundle;
import android.os.Handler;
import android.os.Message;
import android.view.KeyEvent;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import android.view.ViewGroup;
import android.widget.AdapterView;
import android.widget.BaseAdapter;
import android.widget.FrameLayout;
import android.widget.ListView;
import android.widget.AdapterView.OnItemClickListener;

public class TitaniumTableView extends FrameLayout
	implements ITitaniumTableView, Handler.Callback, ITitaniumView
{
	private static final String LCAT = "TitaniumTableView";

	private static final int MSG_OPEN = 300;
	private static final int MSG_CLOSE = 301;
	private static final int MSG_SETDATA = 302;
	private static final int MSG_DELETEROW = 303;
	private static final int MSG_UPDATEROW = 304;
	private static final int MSG_INSERTBEFORE = 305;
	private static final int MSG_INSERTAFTER = 306;

	private static final String MSG_EXTRA_CALLBACK = "cb";

	private TitaniumModuleManager tmm;
	private int rowHeight;
	private Handler handler;
	private boolean root;
	private String name;
	private String openJSON;
	private String callback;
	private TableViewModel viewModel;
	boolean hasBeenOpened;
	private TTVListAdapter adapter;
	private ListView view;

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

		public View getView(int position, View convertView, ViewGroup parent)
		{
			TitaniumTableViewItem v = null;
			if (convertView != null) {
				v = (TitaniumTableViewItem) convertView;
			} else {
				v = new TitaniumTableViewItem(tmm.getActivity());
			}

			v.setRowData((JSONObject) getItem(position), rowHeight);

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
	}

	public TitaniumTableView(TitaniumModuleManager tmm, int themeId)
	{
		super(tmm.getActivity(), null, themeId);

		this.tmm = tmm;
		this.handler = new Handler(this);
		this.rowHeight = 65;
		this.root = false;
		this.viewModel = new TableViewModel();
		this.hasBeenOpened = false;
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

	public int getRowCount() {
		return viewModel.getRowCount();
	}

	public int getIndexByName(String name) {
		return viewModel.getIndexByName(name);
	}

	public void setRowHeight(String height) {
		this.rowHeight = Integer.parseInt(height);
	}

	public void setIsRoot(boolean root) {
		this.root = root;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public boolean isPrimary() {
		//return root;
		return true;
	}

	public boolean handleMessage(Message msg)
	{
		Bundle b = msg.getData();

		switch(msg.what) {
		case MSG_OPEN:
			doOpen(b.getString(MSG_EXTRA_CALLBACK));
			return true;
		case MSG_CLOSE:
			doClose();
			return true;
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
		}
		return false;
	}

	public void configure(String json, final String callback)
	{
		this.openJSON = json;
		this.callback = callback;
		this.root = true;
	}

	public void showing() {
		if (!hasBeenOpened) {
			Message m = handler.obtainMessage(MSG_OPEN);
			m.getData().putString(MSG_EXTRA_CALLBACK, callback);
			m.sendToTarget();
		}
	}

	public void hiding() {

	}

	private void doOpen(final String callback)
	{
		FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(LayoutParams.FILL_PARENT, LayoutParams.WRAP_CONTENT);
		setLayoutParams(params);
		setPadding(5,5,5,5);

		view = new ListView(tmm.getActivity());
		view.setFocusable(true);
		view.setFocusableInTouchMode(true);
		adapter = new TTVListAdapter(viewModel);
		view.setAdapter(adapter);
		view.setOnKeyListener(new View.OnKeyListener() {

			public boolean onKey(View view, int keyCode, KeyEvent keyEvent)
			{
				if (keyCode == KeyEvent.KEYCODE_BACK &&
						keyEvent.getRepeatCount() == 0 &&
						keyEvent.getAction() == KeyEvent.ACTION_DOWN
						)
				{
//						close();
					return root ? false : true;
				}
				return false;
			}});

		view.setOnItemClickListener(new OnItemClickListener() {

			public void onItemClick(AdapterView<?> parent, View view, int position, long id)
			{
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

					tmm.getWebView().evalJS(callback, event);

				} catch (JSONException e) {
					Log.e(LCAT, "Error handling event at position: " + position);
				}
			}});

		addView(view, new FrameLayout.LayoutParams(LayoutParams.FILL_PARENT, LayoutParams.WRAP_CONTENT));
		hasBeenOpened = true;
	}

	public void close()
	{
		handler.sendEmptyMessage(MSG_CLOSE);
	}

	private void doClose() {
		//tmm.getActivity().popView(this);
		destroyDrawingCache();
		removeAllViews();
	}

	public ITitaniumLifecycle getLifecycle() {
		return null;
	}

	public View getNativeView() {
		return this;
	}

	public void dispatchWindowFocusChanged(boolean hasFocus) {
		tmm.getWebView().dispatchWindowFocusChanged(hasFocus);
	}

	public void dispatchConfigurationChange(Configuration newConfig) {
		//tmm.getWebView().dispatchConfigurationChange(newConfig);
	}

	// Called on the current view, so forward to our controller
	public boolean dispatchOptionsItemSelected(MenuItem item) {
		return tmm.getWebView().dispatchOptionsItemSelected(item);
	}

	// Called on the current view, so forward to our controller
	public boolean dispatchPrepareOptionsMenu(Menu menu) {
		return tmm.getWebView().dispatchPrepareOptionsMenu(menu);
	}
}

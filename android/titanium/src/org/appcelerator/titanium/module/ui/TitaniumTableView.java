package org.appcelerator.titanium.module.ui;

import org.appcelerator.titanium.TitaniumActivity;
import org.appcelerator.titanium.api.ITitaniumTableView;
import org.appcelerator.titanium.util.TitaniumJavascriptHelper;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.app.Dialog;
import android.os.Handler;
import android.util.Log;
import android.view.KeyEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewGroup.LayoutParams;
import android.widget.AdapterView;
import android.widget.BaseAdapter;
import android.widget.FrameLayout;
import android.widget.ListView;
import android.widget.AdapterView.OnItemClickListener;

public class TitaniumTableView extends Dialog implements ITitaniumTableView
{
	private static final String LCAT = "TitaniumTableView";

	private TitaniumActivity activity;
	private String data;
	private int rowHeight;
	private Handler handler;

	class TTVListAdapter extends BaseAdapter
	{
		JSONArray items;

		TTVListAdapter(JSONArray items) {
			this.items = items;
		}

		public int getCount() {
			return items.length();
		}

		public Object getItem(int position) {
			JSONObject o = null;
			try {
				o = items.getJSONObject(position);
			} catch (JSONException e) {
				Log.w(LCAT, "Error while getting JSON object at " + position, e);
			}
			return o;
		}

		public long getItemId(int position) {
			// TODO Auto-generated method stub
			return 0;
		}

		public View getView(int position, View convertView, ViewGroup parent) {
			TitaniumTableViewItem v = null;
			if (convertView != null) {
				v = (TitaniumTableViewItem) convertView;
			} else {
				v = new TitaniumTableViewItem(activity);
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
			if (o.has("header")) {
				enabled = false;
			}
			return enabled;
		}
	}

	public TitaniumTableView(TitaniumActivity activity, int themeId)
	{
		super(activity, themeId);

		this.activity = activity;
		this.handler = new Handler();
		this.rowHeight = 65;
	}

	public void setData(String data) {
		this.data = data;
	}

	public void setRowHeight(String height) {
		this.rowHeight = Integer.parseInt(height);
	}

	public void open(String json, final String callback)
	{
		Log.e(LCAT, "OPEN");

		FrameLayout layout = new FrameLayout(activity);
		FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(LayoutParams.FILL_PARENT, LayoutParams.WRAP_CONTENT);
		layout.setLayoutParams(params);
		layout.setPadding(5,5,5,5);

		ListView view = new ListView(activity);
		view.setFocusable(true);
		view.setFocusableInTouchMode(true);

		final JSONArray jdata = processData(data);

		view.setAdapter(new TTVListAdapter(jdata));
		view.setOnKeyListener(new View.OnKeyListener() {

			public boolean onKey(View view, int keyCode, KeyEvent keyEvent)
			{
				if (keyCode == KeyEvent.KEYCODE_BACK &&
						keyEvent.getRepeatCount() == 0 &&
						keyEvent.getAction() == KeyEvent.ACTION_DOWN
						)
				{
					close();
					return true;
				}
				return false;
			}});

		view.setOnItemClickListener(new OnItemClickListener() {

			public void onItemClick(AdapterView<?> parent, View view, int position, long id)
			{
				try {
					JSONObject item = jdata.getJSONObject(position);
					JSONObject event = new JSONObject();

					event.put("rowData", item);
					event.put("section", item.getInt("section"));
					event.put("row", item.getInt("sectionIndex"));
					event.put("index", position);
					event.put("detail", false);

					TitaniumJavascriptHelper.evalJS(activity.getWebView(), handler, callback,event);
				} catch (JSONException e) {
					Log.e(LCAT, "Error handling event at position: " + position);
				}
			}});

		layout.addView(view, new FrameLayout.LayoutParams(LayoutParams.FILL_PARENT, LayoutParams.WRAP_CONTENT));
		setContentView(layout);
		show();
		//layout.requestFocus();
	}

	public void close()
	{
		super.dismiss();
	}

	private JSONArray processData(String data) {
		JSONArray jdata = new JSONArray();
		try {
			jdata = new JSONArray(data);
		} catch (JSONException e) {
			Log.e(LCAT, "Error parsing JSON, using empty array", e);
		}

		int len = jdata.length();
		int section = 0;
		int sectionIndex = 0;

		for(int i = 0; i < len; i++) {
			try {
				JSONObject o = jdata.getJSONObject(i);
				if (o.has("header")) {
					if (section != 0 || i != 0) {
						section++;
					}
					sectionIndex = 0;
				}
				o.put("section", section);
				o.put("sectionIndex", sectionIndex);
				sectionIndex++;
			} catch (JSONException e) {
				Log.e(LCAT, "Error using object at position: " + i);
			}
		}

		return jdata;
	}
}

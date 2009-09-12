package org.appcelerator.titanium.module.ui.widgets;

import java.util.ArrayList;

import org.appcelerator.titanium.config.TitaniumConfig;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TitaniumUIHelper;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.content.Context;
import android.graphics.Color;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.FrameLayout;
import android.widget.RelativeLayout;
import android.widget.Spinner;
import android.widget.TextView;

public class TitaniumPickerView extends RelativeLayout
	implements AdapterView.OnItemSelectedListener
{
	public interface OnItemSelectionListener {
		public void onItemSelected(TitaniumPickerView view, int col, int row);
	};

	private static final String LCAT = "TiPickerView";
	private static final boolean DBG = TitaniumConfig.LOGD;

	private OnItemSelectionListener onItemSelectionListener;

	private static final int BASE_ID = 500;

	private JSONArray data;
	ArrayList<Spinner> spinners;

	class ItemView extends RelativeLayout
	{
		public WebView webView;
		public TextView textView;

		public ItemView(Context context) {
			super(context);
			setGravity(Gravity.CENTER_VERTICAL);
			setPadding(5,5,5,5);
		}

		public void setText(String value, boolean html)
		{
			if (webView != null) {
				webView.setVisibility(View.GONE);
			}
			if (textView != null) {
				textView.setVisibility(View.GONE);
			}

			if (html) {
				if (webView == null) {
					webView = new WebView(getContext());
					webView.setBackgroundColor(Color.TRANSPARENT);
					webView.setFocusable(false);
					webView.setFocusableInTouchMode(false);
					webView.setClickable(false);
					RelativeLayout.LayoutParams params = new RelativeLayout.LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT);
					params.addRule(RelativeLayout.CENTER_VERTICAL);
					addView(webView, params);
				}
				webView.setVisibility(View.VISIBLE);
				webView.loadDataWithBaseURL("file:///android_asset/Resources/", value, "text/html", "UTF-8", null);
			} else {
				if (textView == null) {
					textView = new TextView(getContext());
					textView.setTextColor(Color.BLACK);
					textView.setBackgroundColor(Color.TRANSPARENT);
					textView.setFocusable(false);
					textView.setFocusableInTouchMode(false);
					textView.setClickable(false);
					RelativeLayout.LayoutParams params = new RelativeLayout.LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT);
					params.addRule(RelativeLayout.CENTER_VERTICAL);
					addView(textView, params);
				}
				textView.setVisibility(View.VISIBLE);
				textView.setText(value);
			}

		}
	}

	public TitaniumPickerView(Context context)
	{
		super(context);

		if (DBG) {
			Log.i(LCAT, "Created.");
		}
	}

	public void setData(JSONArray data) {
		removeAllViews();
		this.data = data;
		if (spinners == null) {
			spinners = new ArrayList<Spinner>();
		} else {
			for(Spinner s : spinners) {
				s.destroyDrawingCache();
				s.setOnItemSelectedListener(null);
			}
		}

		try {
			for(int i = 0; i < data.length(); i++) {
				JSONObject o = data.getJSONObject(i);
				handleColumn(i, o);
			}
		} catch (JSONException e) {
			Log.e(LCAT, "Error processing data: ", e);
		}
		invalidate();
	}

	private void handleColumn(int col, JSONObject d) throws JSONException
	{
		int width = LayoutParams.WRAP_CONTENT;
		int height = LayoutParams.FILL_PARENT;

		if (d.has("width")) {
			String w = d.getString("width");
			width = (int) TitaniumUIHelper.getSize(w);
		}
		if (d.has("height")) {
			String h = d.getString("height");
			height = (int) TitaniumUIHelper.getSize(h);
		}

		int selected = 0;

		JSONArray itemList = d.getJSONArray("data");
		JSONObject[] items = new JSONObject[itemList.length()];
		for(int j = 0; j < items.length; j++) {
			JSONObject o = itemList.getJSONObject(j);
			items[j] = o;
			if (o.optBoolean("selected", false)) {
				selected = j;
			}
		}

		if (col < spinners.size()) {
			Spinner s = spinners.get(col);
			s.setOnItemSelectedListener(null);
		}
		Spinner spinner = new Spinner(getContext());
        spinners.add(spinner);

        spinner.setId(BASE_ID + col);

        ArrayAdapter<JSONObject> aa = new ArrayAdapter<JSONObject>(getContext(), android.R.layout.simple_spinner_item, items) {


			@Override
			public View getDropDownView(int position, View convertView, ViewGroup parent) {
				ItemView iv = (ItemView) getView(position, convertView, parent);

				iv.setMinimumHeight(60);

				return iv;
			}

			@Override
			public View getView(int position, View convertView, ViewGroup parent) {
        		ItemView iv = (ItemView) convertView;
        		if (iv ==null) {
        			iv = new ItemView(getContext());
        		}

        		try {
	        		JSONObject o = getItem(position);
	        		if (o.has("html")) {
	        			iv.setText(o.getString("html"), true);
	        		} else {
	        			iv.setText(o.getString("title"), false);
	        		}
        		} catch (JSONException e) {
        			Log.w(LCAT, "Unable to set value on item: ", e);
        			iv.setText("ERROR", false);
        		}
        		return iv;
			}
        };

        aa.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        spinner.setAdapter(aa);
        spinner.setSelection(selected);
        spinner.setOnItemSelectedListener(this);

        RelativeLayout.LayoutParams params = new RelativeLayout.LayoutParams(width,height);
        params.addRule(CENTER_VERTICAL);
        if (col == 0) {
        	params.addRule(ALIGN_PARENT_LEFT);
        } else {
        	params.addRule(RIGHT_OF, (col - 1) + BASE_ID);
        }
        params.alignWithParent = true;
        addView(spinner,params);

	}

	public int getSelectedRow(int col) {
		int index = -1;

		index = spinners.get(col).getSelectedItemPosition();

		return index;
	}

	public void selectRow(int col, int row) {
		spinners.get(col).setSelection(row, true);
	}

	public void setColumnData(int col, JSONObject d)
	{
		try {
			handleColumn(col, d);
		} catch (JSONException e) {
			Log.e(LCAT, "Unable to set column data for column " + col, e);
		}
	}

	public void onItemSelected(AdapterView<?> parent, View view, int position, long id) {
		int col = parent.getId() - BASE_ID;
		int row = position;

		if (onItemSelectionListener != null) {
			onItemSelectionListener.onItemSelected(this, col, row);
		}
	}

	public void onNothingSelected(AdapterView<?> view) {
	}

	public void setOnItemSelectionListener(OnItemSelectionListener listener) {
		this.onItemSelectionListener = listener;
	}
}

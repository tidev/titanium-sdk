package org.appcelerator.titanium.module.ui.widgets;

import java.util.ArrayList;

import org.appcelerator.titanium.config.TitaniumConfig;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TitaniumUIHelper;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.content.Context;
import android.view.View;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.RelativeLayout;
import android.widget.Spinner;

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
		String[] items = new String[itemList.length()];
		for(int j = 0; j < items.length; j++) {
			JSONObject o = itemList.getJSONObject(j);
			items[j] = o.getString("title");
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

        ArrayAdapter<String> aa = new ArrayAdapter<String>(getContext(), android.R.layout.simple_spinner_item, items) {

		/*	@Override
			public View getView(int position, View convertView, ViewGroup parent) {
				TextView tv = new TextView(parent.getContext());
				tv.setText(getItem(position));
				//tv.setBackgroundColor(Color.WHITE);
				tv.setTextColor(Color.BLACK);
				return tv;
			}
		*/
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

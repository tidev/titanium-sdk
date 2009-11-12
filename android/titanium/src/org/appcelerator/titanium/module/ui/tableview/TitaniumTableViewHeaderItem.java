/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.module.ui.tableview;

import org.appcelerator.titanium.config.TitaniumConfig;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TitaniumUIHelper;
import org.json.JSONException;
import org.json.JSONObject;

import android.content.Context;
import android.graphics.Color;
import android.os.Handler;
import android.view.Gravity;
import android.widget.RelativeLayout;
import android.widget.TextView;

public class TitaniumTableViewHeaderItem extends TitaniumBaseTableViewItem
{
	private static final String LCAT = "TitaniamTableViewItem";
	private static final boolean DBG = TitaniumConfig.LOGD;

	private RowView rowView;

	class RowView extends RelativeLayout
	{
		private TextView textView;

		public RowView(Context context) {
			super(context);

			setGravity(Gravity.CENTER_VERTICAL);

			textView = new TextView(context);
			textView.setId(101);
			textView.setFocusable(false);
			textView.setFocusableInTouchMode(false);
			RelativeLayout.LayoutParams params = new RelativeLayout.LayoutParams(LayoutParams.FILL_PARENT, LayoutParams.FILL_PARENT);
			params.addRule(CENTER_VERTICAL);
			params.alignWithParent = true;
			addView(textView, params);

			setPadding(0, 0, 0, 0);
			setMinimumHeight(18);
			setVerticalFadingEdgeEnabled(false);
			TitaniumUIHelper.styleText(textView, "10dp", "normal");
			textView.setBackgroundColor(Color.DKGRAY);
			textView.setTextColor(Color.LTGRAY);
			textView.setPadding(4, 2, 4, 2);
		}

		public void setRowData(JSONObject template, JSONObject data, int rowHeight, String fontSize, String fontWeight)
		{
			try {
				textView.setText(data.getString("header"), TextView.BufferType.NORMAL);
			} catch (JSONException e) {
				textView.setText(e.getMessage());
				Log.e(LCAT, "Error retrieving header", e);
			}
		}
	}


	public TitaniumTableViewHeaderItem(Context context)
	{
		super(context);

		this.handler = new Handler(this);
		rowView = new RowView(context);
		this.addView(rowView, new LayoutParams(LayoutParams.FILL_PARENT,LayoutParams.FILL_PARENT));
	}

	public void setRowData(JSONObject template, JSONObject data, int rowHeight, String fontSize, String fontWeight) {
		rowView.setRowData(template, data, rowHeight, fontSize, fontWeight);
	}
}

/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.module.ui.tableview;

import java.util.ArrayList;
import java.util.HashSet;

import javax.swing.text.IconView;

import org.appcelerator.titanium.config.TitaniumConfig;
import org.appcelerator.titanium.module.ui.widgets.TitaniumCompositeLayout;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TitaniumColorHelper;
import org.appcelerator.titanium.util.TitaniumFileHelper;
import org.appcelerator.titanium.util.TitaniumUIHelper;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.Drawable;
import android.view.Gravity;
import android.view.View;
import android.widget.ImageView;
import android.widget.TextView;

public class TitaniumTableViewCustomItem extends TitaniumBaseTableViewItem
{
	private static final String LCAT = "TitaniamTableViewItem";
	private static final boolean DBG = TitaniumConfig.LOGD;
	private RowView rowView;

	class RowView extends TitaniumCompositeLayout
	{
		class DisplayItem
		{
			public String name;
			public TitaniumCompositeLayout.TitaniumCompositeLayoutParams params;
			public String type;

			public DisplayItem() {
				params = new TitaniumCompositeLayoutParams();
			}
		}

		public RowView(Context context)
		{
			super(context);

			TitaniumCompositeLayoutParams p = (TitaniumCompositeLayoutParams) generateDefaultLayoutParams();
			p.optionZIndex = Integer.MIN_VALUE;
			setLayoutParams(p);
			setPadding(0, 0, 0, 0);
			setVerticalFadingEdgeEnabled(true);

		}

		private JSONObject layoutDataForName(String name, JSONObject item)
			throws JSONException
		{
			JSONObject layout = null;

			if (item != null) {
				JSONArray rowLayout = item.optJSONArray("layout");
				if (rowLayout != null) {
					for(int i = 0; i < rowLayout.length(); i++) {
						JSONObject row = rowLayout.getJSONObject(i);
						String n = row.getString("name");
						if (n.equals(name)) {
							layout = row;
							break;
						}
					}
				}
			}

			return layout;
		}

		private String resolveString(String key, JSONObject item, JSONObject template)
			throws JSONException
		{
			String value = null;

			if (item != null && item.has(key)) {
				value = item.getString(key);
			} else {
				value = template.optString(key, null);
			}

			return value;
		}

		private Integer resolveInteger(String key, JSONObject item, JSONObject template)
			throws JSONException
		{
			Integer value = null;

			if (item != null && item.has(key)) {
				if (!item.isNull(key)) {
					value = item.getInt(key);
				}
			} else if (template.has(key)) {
				if (!template.isNull(key)) {
					value = template.getInt(key);
				}
			}

			return value;
		}

		private ArrayList<DisplayItem> resolveDisplayItems(JSONObject template, JSONObject data)
		{
			ArrayList<DisplayItem> items = new ArrayList<DisplayItem>(5);
			try {
				HashSet<String> names = new HashSet<String>();

				JSONArray rowLayout = null;

				if (template != null) {
					rowLayout = template.optJSONArray("layout");
					if (rowLayout != null) {
						for(int i = 0; i < rowLayout.length(); i++) {
							JSONObject row = rowLayout.getJSONObject(i);
							String name = row.getString("name");
							names.add(name);
						}
					}
				}

				rowLayout = data.optJSONArray("layout");
				if (rowLayout != null) {
					for(int i = 0; i < rowLayout.length(); i++) {
						JSONObject row = rowLayout.getJSONObject(i);
						String name = row.getString("name");
						names.add(name);


					}
				}

				// Now we have the set of displayable item names.

				int i = 0;

				for(String name : names) {
					JSONObject tLayout = layoutDataForName(name, template);
					JSONObject rLayout = layoutDataForName(name, data);

					DisplayItem d = new DisplayItem();
					d.name = name;
					d.type = resolveString("type", rLayout, tLayout);

					d.params.optionBottom = resolveInteger("bottom", rLayout, tLayout);
					d.params.optionTop = resolveInteger("top", rLayout, tLayout);
					d.params.optionLeft = resolveInteger("left", rLayout, tLayout);
					d.params.optionRight = resolveInteger("right", rLayout, tLayout);
					d.params.optionWidth = resolveInteger("width", rLayout, tLayout);
					d.params.optionHeight = resolveInteger("height", rLayout, tLayout);
					d.params.optionZIndex = resolveInteger("zIndex", rLayout, tLayout);
					d.params.index = i++;

					items.add(d);
				}

			} catch (JSONException e) {
				Log.e(LCAT, "Error computing display items: " + e.getMessage(), e);
			}

			return items;
		}

		public void setRowData(TitaniumTableViewItemOptions defaults, JSONObject template, JSONObject data)
		{
			removeAllViews(); // consider detaching and reusing, versus dumping.

			TitaniumFileHelper tfh = new TitaniumFileHelper(getContext());

			ArrayList<DisplayItem> items = resolveDisplayItems(template, data);
			int rowHeight = defaults.resolveIntOption("rowHeight", data, template);
			setMinimumHeight(rowHeight);

			String rowValue = null;

			rowValue = defaults.resolveOption("selectedBackgroundColor", data, template);
			if (rowValue != null) {

			}

			for(DisplayItem item : items) {
				try {
					if (data.has(item.name)) {
						JSONObject tLayout = layoutDataForName(item.name, template);
						JSONObject rLayout = layoutDataForName(item.name, data);

						View v = null;

						if (item.type.equals("text")) {
							TextView tv = new TextView(getContext());
							tv.setTag(item.name);
							tv.setPadding(0, 0, 0, 0);
							tv.setGravity(Gravity.CENTER_VERTICAL);

							tv.setText(data.getString(item.name));

							TitaniumUIHelper.styleText(tv,
									defaults.resolveOption("fontSize", rLayout, tLayout),
									defaults.resolveOption("fontWeight", rLayout, tLayout));

							String value = null;

							value = defaults.resolveOption("backgroundColor", rLayout, tLayout);
							if (value != null) {
								tv.setBackgroundColor(TitaniumColorHelper.parseColor(value));
							}
							value = defaults.resolveOption("color", rLayout, tLayout);
							if (value != null) {
								tv.setTextColor(TitaniumColorHelper.parseColor(value));
							}

							v = tv;
						} else if (item.type.equals("image")) {

							String path = data.getString(item.name);
							Drawable d = tfh.loadDrawable(path, false);
							if (d != null) {
								ImageView iv = new ImageView(getContext());
								BitmapDrawable b = (BitmapDrawable) d;
								if (b.getBitmap().getHeight() > rowHeight) {
									d = new BitmapDrawable(Bitmap.createScaledBitmap(b.getBitmap(), rowHeight, rowHeight, true));
								}
								iv.setPadding(0, 0, 0, 0);
								iv.setImageDrawable(d);

								v = iv;
							}
						} else {
							Log.w(LCAT, "Data item type not supported: " + item.type);
						}

						if (v != null) {
							addView(v, item.params);
						}
					}
				} catch (JSONException e) {
					Log.e(LCAT, "Error while processing item with name: " + item.name);
				}
			}
		}
	}

	public TitaniumTableViewCustomItem(Context context)
	{
		super(context);

		rowView = new RowView(context);
		this.addView(rowView, new LayoutParams(LayoutParams.FILL_PARENT,LayoutParams.FILL_PARENT));
	}

	public void setRowData(TitaniumTableViewItemOptions defaults, JSONObject template, JSONObject data) {
		rowView.setRowData(defaults, template, data);
	}
}

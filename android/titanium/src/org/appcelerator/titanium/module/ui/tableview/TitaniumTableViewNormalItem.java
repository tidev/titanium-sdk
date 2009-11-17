/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.module.ui.tableview;

import org.appcelerator.titanium.config.TitaniumConfig;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TitaniumFileHelper;
import org.appcelerator.titanium.util.TitaniumUIHelper;
import org.json.JSONException;
import org.json.JSONObject;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.StateListDrawable;
import android.os.Build;
import android.view.Gravity;
import android.view.View;
import android.widget.ImageView;
import android.widget.RelativeLayout;
import android.widget.TextView;

public class TitaniumTableViewNormalItem extends TitaniumBaseTableViewItem
{
	private static final String LCAT = "TitaniamTableViewItem";
	private static final boolean DBG = TitaniumConfig.LOGD;
	private RowView rowView;

	class RowView extends RelativeLayout
	{
		private ImageView iconView;
		private TextView textView;
		private ImageView hasChildView;

		private Drawable hasMoreDrawable;

		private Drawable defaultBackground;
		private int defaultTextColor;
		boolean providesSelector;

		public RowView(Context context) {
			super(context);

			if (Integer.parseInt(Build.VERSION.SDK) > 3) {
				setGravity(Gravity.NO_GRAVITY);
			} else {
				setGravity(Gravity.CENTER_VERTICAL);
			}

			iconView = new ImageView(context);
			iconView.setId(100);
			iconView.setFocusable(false);
			iconView.setFocusableInTouchMode(false);

			textView = new TextView(context);
			textView.setId(101);
			textView.setFocusable(false);
			textView.setFocusableInTouchMode(false);

			defaultBackground = getBackground();
			defaultTextColor = textView.getCurrentTextColor();

			hasChildView = new ImageView(context);
			hasChildView.setId(102);
			hasChildView.setFocusable(false);
			hasChildView.setFocusableInTouchMode(false);

			LayoutParams params = new RelativeLayout.LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.FILL_PARENT);
			params.addRule(CENTER_VERTICAL);
			params.setMargins(0, 0, 5, 0);
			addView(iconView, params);

			params = new RelativeLayout.LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.FILL_PARENT);
			params.addRule(CENTER_VERTICAL);
			params.addRule(ALIGN_RIGHT);
			params.setMargins(0, 0, 7, 0);
			params.alignWithParent = true;
			addView(hasChildView, params);

			params = new RelativeLayout.LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.FILL_PARENT);
			params.addRule(CENTER_VERTICAL);
			params.addRule(RIGHT_OF, iconView.getId());
			params.addRule(LEFT_OF, hasChildView.getId());
			params.alignWithParent = true;
			addView(textView, params);

			setPadding(0, 0, 0, 0);
		}

		public void setRowData(TitaniumTableViewItemOptions defaults, JSONObject data)
		{
			TitaniumFileHelper tfh = new TitaniumFileHelper(getContext());

			int rowHeight = defaults.resolveIntOption("rowHeight", data);
			setVerticalFadingEdgeEnabled(true);
			providesSelector = false;

			setMinimumHeight(rowHeight);

			if (data.has("image")) {
				try {
					String path = data.getString("image");
					Drawable d = tfh.loadDrawable(path, false);
					if (d != null) {
						BitmapDrawable b = (BitmapDrawable) d;
						if (b.getBitmap().getHeight() > rowHeight) {
							d = new BitmapDrawable(Bitmap.createScaledBitmap(b.getBitmap(), rowHeight, rowHeight, true));
						}
						iconView.setImageDrawable(d);
						iconView.setVisibility(View.VISIBLE);
					}

				} catch (JSONException e) {
					Log.e(LCAT, "Error retrieving image", e);
				}
			} else {
				iconView.setVisibility(View.GONE);
			}

			if (data.has("hasChild")) {
				try {
					if (data.getBoolean("hasChild")) {
						if(hasMoreDrawable == null) {
							hasMoreDrawable = createHasChildDrawable();
						}
						if (hasMoreDrawable != null) {
							hasChildView.setImageDrawable(hasMoreDrawable);
						}
						hasChildView.setVisibility(View.VISIBLE);
					}
				} catch (JSONException e) {
					Log.e(LCAT, "Error retrieving hasChild", e);
				}
			} else {
				hasChildView.setVisibility(View.GONE);
			}

			if (data.has("title")) {
				textView.setPadding(4, 0, 4, 0);
				textView.setBackgroundDrawable(defaultBackground);
	 			textView.setTextColor(defaultTextColor);

				try {
					textView.setText(data.getString("title"), TextView.BufferType.NORMAL);
					TitaniumUIHelper.styleText(textView, defaults.resolveOption("fontSize", data), defaults.resolveOption("fontWeight", data));
				} catch (JSONException e) {
					textView.setText(e.getMessage());
					Log.e(LCAT, "Error retrieving title", e);
				}
			}

			String backgroundImage = defaults.resolveOption("backgroundImage", data);
			String backgroundSelectedImage = defaults.resolveOption("selectedBackgroundImage", data);
			String backgroundFocusedImage = defaults.resolveOption("focusedBackgroundImage", data);

			StateListDrawable sld = TitaniumUIHelper.buildBackgroundDrawable(getContext(), backgroundImage, backgroundSelectedImage, backgroundFocusedImage);
			if (sld != null) {
				setBackgroundDrawable(sld);
				providesSelector = true;
			}
		}
	}

	public TitaniumTableViewNormalItem(Context context)
	{
		super(context);

		rowView = new RowView(context);
		this.addView(rowView, new LayoutParams(LayoutParams.FILL_PARENT,LayoutParams.FILL_PARENT));
	}

	public void setRowData(TitaniumTableViewItemOptions defaults, JSONObject template, JSONObject data) {
		rowView.setRowData(defaults, data);
	}

	@Override
 	public boolean providesOwnSelector() {
		return rowView.providesSelector;
	}
}

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
import org.json.JSONException;
import org.json.JSONObject;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.Drawable;
import android.os.Message;
import android.view.Gravity;
import android.view.View;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.ImageView;
import android.widget.RelativeLayout;

public class TitaniumTableViewHtmlItem extends TitaniumBaseTableViewItem
{
	private static final String LCAT = "TitaniamTableViewItem";
	private static final boolean DBG = TitaniumConfig.LOGD;

	private static final int MSG_SHOW_WEBVIEW = 300;

	private RowView rowView;

	class RowView extends RelativeLayout
	{
		private ImageView iconView;
		private ImageView hasChildView;
		private LocalWebView webView;

		private Drawable hasMoreDrawable;

		private Drawable defaultBackground;
		private int defaultTextColor;

		public RowView(Context context) {
			super(context);

			setGravity(Gravity.CENTER_VERTICAL);

			iconView = new ImageView(context);
			iconView.setId(100);
			iconView.setFocusable(false);
			iconView.setFocusableInTouchMode(false);

			defaultBackground = getBackground();
			defaultTextColor = Color.BLACK;

			hasChildView = new ImageView(context);
			hasChildView.setId(102);
			hasChildView.setFocusable(false);
			hasChildView.setFocusableInTouchMode(false);

			webView = new LocalWebView(context, defaultTextColor);

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

			params = new RelativeLayout.LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT);
			params.addRule(CENTER_VERTICAL);
			params.addRule(RIGHT_OF, iconView.getId());
			params.addRule(LEFT_OF, hasChildView.getId());
			params.alignWithParent = true;
			addView(webView, params);

			setPadding(0, 0, 0, 0);
			setVerticalFadingEdgeEnabled(true);
		}

		public void setRowData(JSONObject template, JSONObject data, int rowHeight, String fontSize, String fontWeight)
		{
			TitaniumFileHelper tfh = new TitaniumFileHelper(getContext());

			if (data.has("rowHeight")) {
				try {
					rowHeight = data.getInt("rowHeight");
				} catch (JSONException e) {
					Log.w(LCAT, "Error getting rowHeight: " + e.getMessage());
				}
			}
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
							hasMoreDrawable = new BitmapDrawable(getClass().getResourceAsStream("/org/appcelerator/titanium/res/drawable/btn_more.png"));
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

			if (data.has("html")) {
				webView.setVisibility(View.INVISIBLE);
				webView.setMinimumHeight(rowHeight);

				try {
					String html = data.getString("html");
					if (html != null) {
						webView.load(html, rowHeight);
					}
				} catch (JSONException e) {
					Log.e(LCAT, "Error retrieving html", e);
				}
			}

			requestLayout();
		}

		public void showWebView() {
			if (webView.getVisibility() == View.INVISIBLE) {
				webView.setVisibility(View.VISIBLE);
			}
		}
	}

	class LocalWebView extends WebView
	{
		///public int rowHeight;

		private String htmlPrefix;
		private String htmlPostfix;
		private int rowHeight;

		public LocalWebView(Context context, int defaultTextColor)
		{
			super(context);

			this.setFocusable(false);
			this.setFocusableInTouchMode(false);
			this.setClickable(false);

			WebSettings settings = getSettings();
			settings.setLoadsImagesAutomatically(true);
			settings.setSupportMultipleWindows(false);
			settings.setSupportZoom(false);
			settings.setJavaScriptCanOpenWindowsAutomatically(false);
			settings.setJavaScriptEnabled(false);

			setScrollContainer(false);
			setHorizontalScrollBarEnabled(false);
			setVerticalScrollBarEnabled(false);

			setBackgroundColor(Color.TRANSPARENT);
			setId(101);

			StringBuilder sb = new StringBuilder();
			sb.append("<html><body style='color:rgba(").append(Color.red(defaultTextColor)).append(",")
				.append(Color.green(defaultTextColor)).append(",")
				.append(Color.blue(defaultTextColor)).append(",")
				.append(Color.alpha(defaultTextColor))
				.append("); '>")
				;
			htmlPrefix = sb.toString();
			htmlPostfix = "</body></html>";

			setWebViewClient(new WebViewClient() {

				@Override
				public void onPageFinished(WebView view, String url) {
					super.onPageFinished(view, url);

					handler.sendEmptyMessageDelayed(MSG_SHOW_WEBVIEW, 10);
				}

			});
		}

		public void load(String html, int rowHeight)
		{
			this.rowHeight = rowHeight;
			StringBuilder sb = new StringBuilder();
			sb.append(htmlPrefix).append(html).append(htmlPostfix);
			loadDataWithBaseURL("file:///android_asset/Resources/", sb.toString(), "text/html", "UTF-8", null);
		}

		private String modeString(int mode) {
			switch (mode) {
			case MeasureSpec.AT_MOST : return "AT_MOST";
			case MeasureSpec.EXACTLY : return "EXACTLY";
			case MeasureSpec.UNSPECIFIED : return "UNSPECIFIED";
			default : return "DEFAULT";
			}
		}

		@Override
		protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec) {
			if (false) {
				int wMode = MeasureSpec.getMode(widthMeasureSpec);
				int wSize = MeasureSpec.getSize(widthMeasureSpec);
				int hMode = MeasureSpec.getMode(heightMeasureSpec);
				int hSize = MeasureSpec.getSize(heightMeasureSpec);

				Log.e(LCAT, "MEASURE: " + modeString(wMode) + " " + wSize + ", " + modeString(hMode) + " " + hSize);
			}
			setMeasuredDimension(MeasureSpec.getSize(widthMeasureSpec), rowHeight);
		}
	}

	public TitaniumTableViewHtmlItem(Context context)
	{
		super(context);

		rowView = new RowView(context);
		this.addView(rowView, new LayoutParams(LayoutParams.FILL_PARENT,LayoutParams.FILL_PARENT));
	}

	public void setRowData(JSONObject template, JSONObject data, int rowHeight, String fontSize, String fontWeight) {
		rowView.setRowData(template, data, rowHeight, fontSize, fontWeight);
	}

	public boolean handleMessage(Message msg)
	{
		if (!super.handleMessage(msg) && msg.what == MSG_SHOW_WEBVIEW) {
			rowView.showWebView();
			invalidate();
			return true;
		}
		return false;
	}
}

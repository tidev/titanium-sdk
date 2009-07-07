package org.appcelerator.titanium.module.ui;

import org.appcelerator.titanium.util.TitaniumFileHelper;
import org.json.JSONException;
import org.json.JSONObject;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.Drawable;
import android.text.Html;
import android.util.Log;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.View;
import android.widget.ImageView;
import android.widget.RelativeLayout;
import android.widget.TextView;

public class TitaniumTableViewItem extends RelativeLayout
{
	private static final String LCAT = "TitaniamTableViewItem";

	private ImageView iconView;
	private TextView textView;
	private ImageView hasChildView;
	private boolean header;

	private Drawable defaultBackground;
	private int defaultTextColor;
	private float defaultTextSize;

	public TitaniumTableViewItem(Context context) {
		super(context);

		setGravity(Gravity.CENTER_VERTICAL);
		//setFocusable(true);
		//requestFocus();

		iconView = new ImageView(context);
		iconView.setId(100);
		iconView.setFocusable(false);
		iconView.setFocusableInTouchMode(false);

		textView = new TextView(context);
		textView.setId(101);
		textView.setFocusable(false);
		textView.setFocusableInTouchMode(false);

		hasChildView = new ImageView(context);
		hasChildView.setId(102);
		hasChildView.setFocusable(false);
		hasChildView.setFocusableInTouchMode(false);

		LayoutParams params = new RelativeLayout.LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT);
		params.addRule(CENTER_VERTICAL);
		addView(iconView, params);

		params = new RelativeLayout.LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.FILL_PARENT);
		params.addRule(CENTER_VERTICAL);
		params.addRule(RIGHT_OF, iconView.getId());
		params.alignWithParent = false;
		addView(textView, params);

		params = new RelativeLayout.LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT);
		params.addRule(CENTER_VERTICAL);
		params.addRule(ALIGN_PARENT_RIGHT, textView.getId());
		addView(hasChildView, params);

		defaultBackground = getBackground();
		defaultTextColor = textView.getCurrentTextColor();
		defaultTextSize = textView.getTextSize();

	}

	public void setRowData(JSONObject data, int rowHeight)
	{
		TitaniumFileHelper tfh = new TitaniumFileHelper(getContext());

		iconView.setVisibility(View.GONE);
		iconView.destroyDrawingCache();
		textView.setVisibility(View.GONE);
		hasChildView.setVisibility(View.GONE);
		setMinimumHeight(rowHeight);
		header = false;

		setBackgroundDrawable(defaultBackground);
		textView.setTextColor(defaultTextColor);
		textView.setTextSize(defaultTextSize);
		textView.setPadding(0, 0, 0, 0);

		setVerticalFadingEdgeEnabled(true);
		setPadding(10, 2, 10, 2);

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
		}

		if (data.has("header")) {
			textView.setVisibility(View.VISIBLE);
			header = true;
			try {
				textView.setText(data.getString("header"), TextView.BufferType.NORMAL);
				setBackgroundColor(Color.DKGRAY);
				textView.setTextColor(Color.LTGRAY);
				textView.setTextSize(12.0f);
				textView.setPadding(4, 2, 4, 2);
				setMinimumHeight(17);
				setVerticalFadingEdgeEnabled(false);
				setPadding(0, 0, 0, 0);
			} catch (JSONException e) {
				textView.setText(e.getMessage());
				Log.e(LCAT, "Error retrieving header", e);
			}
		} else if (data.has("html")) {
			textView.setVisibility(View.VISIBLE);
			try {
				String html = data.getString("html");
				if (html != null) {
					textView.setText(Html.fromHtml(html), TextView.BufferType.SPANNABLE);
				}
			} catch (JSONException e) {
				Log.e(LCAT, "Error retrieving html", e);
			}
		} else if (data.has("title")) {
			textView.setVisibility(View.VISIBLE);
			try {
				textView.setText(data.getString("title"), TextView.BufferType.NORMAL);
			} catch (JSONException e) {
				textView.setText(e.getMessage());
				Log.e(LCAT, "Error retrieving title", e);
			}
		}

		if (data.has("hasChild")) {
			try {
				if (data.getBoolean("hasChild")) {
					BitmapDrawable d = new BitmapDrawable(getClass().getResourceAsStream("/org/appcelerator/titanium/res/drawable/btn_more.png"));
					if (d != null) {
						hasChildView.setImageDrawable(d);
					}
					hasChildView.setVisibility(View.VISIBLE);
				}
			} catch (JSONException e) {
				Log.e(LCAT, "Error retrieving hasChild", e);
			}
		}
	}

	@Override
	public boolean dispatchKeyEvent(KeyEvent event) {
		Log.e(LCAT, "TTVI d1");
		return super.dispatchKeyEvent(event);
	}

	@Override
	public boolean dispatchKeyEventPreIme(KeyEvent event) {
		Log.e(LCAT, "TTVI d2");
		return super.dispatchKeyEventPreIme(event);
	}

	public boolean isHeader() {
		return header;
	}
}

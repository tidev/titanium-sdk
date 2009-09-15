package org.appcelerator.titanium.module.ui;

import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TitaniumFileHelper;
import org.appcelerator.titanium.util.TitaniumUIHelper;
import org.json.JSONException;
import org.json.JSONObject;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.ColorDrawable;
import android.graphics.drawable.Drawable;
import android.os.Handler;
import android.os.Message;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.View;
import android.view.animation.AlphaAnimation;
import android.view.animation.Animation;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.ImageView;
import android.widget.RelativeLayout;
import android.widget.TextView;
import android.widget.ViewAnimator;

public class TitaniumTableViewItem extends ViewAnimator implements Handler.Callback
{
	private static final String LCAT = "TitaniamTableViewItem";

	private static final int MSG_SHOW_VIEW_1 = 300;

	private Handler handler;

	private RowView rowView;
	private EmptyView emptyView;

	class EmptyView extends ImageView
	{
		public int rowHeight;

		public EmptyView(Context context)
		{
			super(context);

			setImageDrawable(new ColorDrawable(Color.TRANSPARENT));
			setScaleType(ImageView.ScaleType.FIT_XY);
			setAdjustViewBounds(true);
			setFocusable(false);
			setFocusableInTouchMode(false);
			setClickable(false);
		}

		@Override
		protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec) {
			setMeasuredDimension(widthMeasureSpec, rowHeight);
		}

	}

	class RowView extends RelativeLayout
	{
		private ImageView iconView;
		private TextView textView;
		private ImageView hasChildView;
		public boolean header;
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

			webView = new LocalWebView(context, defaultTextColor);

			LayoutParams params = new RelativeLayout.LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.FILL_PARENT);
			params.addRule(CENTER_VERTICAL);
			params.setMargins(0, 0, 5, 0);
			addView(iconView, params);

			params = new RelativeLayout.LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.FILL_PARENT);
			params.addRule(CENTER_VERTICAL);
			params.addRule(ALIGN_RIGHT);
			params.alignWithParent = true;
			addView(hasChildView, params);

			params = new RelativeLayout.LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.FILL_PARENT);
			params.addRule(CENTER_VERTICAL);
			params.addRule(RIGHT_OF, iconView.getId());
			params.addRule(LEFT_OF, hasChildView.getId());
			params.alignWithParent = true;
			addView(textView, params);

			params = new RelativeLayout.LayoutParams(LayoutParams.FILL_PARENT, LayoutParams.FILL_PARENT);
			params.addRule(CENTER_VERTICAL);
			params.addRule(RIGHT_OF, iconView.getId());
			params.addRule(LEFT_OF, hasChildView.getId());
			params.alignWithParent = true;
			addView(webView, params);
		}

		public void setRowData(JSONObject data, int rowHeight, String fontSize, String fontWeight)
		{
			handler.removeMessages(MSG_SHOW_VIEW_1);
			emptyView.rowHeight = rowHeight;
			setDisplayedChild(0);

			TitaniumFileHelper tfh = new TitaniumFileHelper(getContext());

			destroyDrawingCache();
			iconView.setVisibility(View.GONE);
			iconView.destroyDrawingCache();
			textView.setVisibility(View.GONE);
			textView.destroyDrawingCache();
			hasChildView.setVisibility(View.GONE);
			hasChildView.destroyDrawingCache();
			webView.setVisibility(View.GONE);
			webView.destroyDrawingCache();

			header = false;

			setBackgroundDrawable(defaultBackground);
 			textView.setTextColor(defaultTextColor);
			TitaniumUIHelper.styleText(textView, fontSize, fontWeight);
			textView.setPadding(0, 0, 0, 0);

			webView.setPadding(0, 0, 0, 0);
			//webView.rowHeight = rowHeight;

			setVerticalFadingEdgeEnabled(true);
			setPadding(10, 2, 10, 2);

			setMinimumHeight(rowHeight);

			boolean isDisplayHeader = false;
			try {
				isDisplayHeader = data.getBoolean("isDisplayHeader");
			} catch (JSONException e) {
				Log.e(LCAT, "Unable to get header flag", e);
			}


			if (!isDisplayHeader && data.has("image")) {
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

			if (!isDisplayHeader && data.has("hasChild")) {
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
			}

			if (isDisplayHeader && data.has("header")) {
				textView.setVisibility(View.VISIBLE);
				header = true;
				try {
					textView.setText(data.getString("header"), TextView.BufferType.NORMAL);
					setBackgroundColor(Color.DKGRAY);
					textView.setTextColor(Color.LTGRAY);
					textView.setTextSize(12.0f);
					textView.setPadding(4, 2, 4, 2);
					emptyView.rowHeight = 17;
					setMinimumHeight(17);
					setVerticalFadingEdgeEnabled(false);
					setPadding(0, 0, 0, 0);
				} catch (JSONException e) {
					textView.setText(e.getMessage());
					Log.e(LCAT, "Error retrieving header", e);
				}
			} else if (!isDisplayHeader && data.has("html")) {
				try {
					String html = data.getString("html");
					if (html != null) {
						webView.load(html);
					}
				} catch (JSONException e) {
					Log.e(LCAT, "Error retrieving html", e);
				}
				webView.setVisibility(View.VISIBLE);
			} else if (!isDisplayHeader && data.has("title")) {
				textView.setVisibility(View.VISIBLE);
				try {
					textView.setText(data.getString("title"), TextView.BufferType.NORMAL);
					TitaniumUIHelper.styleText(textView, data.optString("fontSize", fontSize), data.optString("fontWeight", fontWeight));
				} catch (JSONException e) {
					textView.setText(e.getMessage());
					Log.e(LCAT, "Error retrieving title", e);
				}
			}

			handler.sendEmptyMessageDelayed(MSG_SHOW_VIEW_1, 250);
		}
	}

	class LocalWebView extends WebView
	{
		///public int rowHeight;

		private String htmlPrefix;
		private String htmlPostfix;

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
		}

		public void load(String html)
		{
			StringBuilder sb = new StringBuilder();
			sb.append(htmlPrefix).append(html).append(htmlPostfix);
			loadDataWithBaseURL("file:///android_asset/Resources/", sb.toString(), "text/html", "UTF-8", null);
		}
	}

	public TitaniumTableViewItem(Context context)
	{
		super(context);

		this.handler = new Handler(this);
		emptyView = new EmptyView(context);
		this.addView(emptyView, new LayoutParams(LayoutParams.FILL_PARENT,LayoutParams.FILL_PARENT));

		rowView = new RowView(context);
		this.addView(rowView, new LayoutParams(LayoutParams.FILL_PARENT,LayoutParams.FILL_PARENT));

		Animation a = new AlphaAnimation(0.0f, 1.0f);
		a.setDuration(250);
		setInAnimation(a);
	}

	public void setRowData(JSONObject data, int rowHeight, String fontSize, String fontWeight) {
		rowView.setRowData(data, rowHeight, fontSize, fontWeight);
	}

	public boolean handleMessage(Message msg)
	{
		if (msg.what == MSG_SHOW_VIEW_1) {
			setDisplayedChild(1);
			return true;
		}

		return false;
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
		return rowView.header;
	}
}

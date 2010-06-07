/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.facebook;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URL;
import java.util.Iterator;
import java.util.Map;
import java.util.Map.Entry;

import temporary.CcUtil;
import android.app.Activity;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Rect;
import android.graphics.RectF;
import android.graphics.Typeface;
import android.graphics.drawable.Drawable;
import android.util.Log;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.animation.AlphaAnimation;
import android.webkit.CookieManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.ImageButton;
import android.widget.LinearLayout;
import android.widget.RelativeLayout;
import android.widget.TextView;

public class FBDialog extends FrameLayout {

	private static final String LOG = FBDialog.class.getSimpleName();

	// /////////////////////////////////////////////////////////////////////////////////////////////////
	// global

	// Activity result codes for the FBDialog class
	public static final int FBDIALOG_RESULT_OK = Activity.RESULT_OK;
	public static final int FBDIALOG_RESULT_CANCEL = Activity.RESULT_CANCELED;
	public static final int FBDIALOG_RESULT_ERROR = Activity.RESULT_FIRST_USER;

	private static final String DEFAULT_TITLE = "Connect to Facebook";
	private static final String STRING_BOUNDARY = "3i2ndDfv2rTHiSisAbouNdArYfORhtTPEefj3q2f";

	private static final int FACEBOOK_BLUE = CcUtil.rgbFloatToInt(0.42578125f,
			0.515625f, 0.703125f, 1.0f);
	private static final int BORDER_GRAY = CcUtil.rgbFloatToInt(0.3f, 0.3f,
			0.3f, 0.8f);

	private static final int kTransitionDuration = 200; // changed from original

	private static final int kTitleMarginX = 8;
	private static final int kTitleMarginY = 4;
	private static final int kPadding = 10;
	private static final int kBorderWidth = 10;
	

	// /////////////////////////////////////////////////////////////////////////////////////////////////

	private IDialogDelegate mDelegate;
	protected FBSession mSession;
	private URL mLoadingURL;
	protected WebView mWebView;
	private TextView mTitleLabel;
	private ImageButton mCloseButton;
	private LinearLayout mContent;
	protected Activity mContext;

	// /////////////////////////////////////////////////////////////////////////////////////////////////

	public FBSession getSession() {
		return mSession;
	}

	public void setSession(FBSession session) {
		mSession = session;
	}

	public IDialogDelegate getDelegate() {
		return mDelegate;
	}

	public void setDelegate(IDialogDelegate delegate) {
		mDelegate = delegate;
	}

	// /////////////////////////////////////////////////////////////////////////////////////////////////
	// private

	private void drawRect(Canvas context, Rect rect, int fillColor, float radius) {
		Paint paint = new Paint();
		paint.setStyle(Paint.Style.FILL);
		paint.setColor(fillColor);
		paint.setAntiAlias(true);
		if (radius > 0) {
			context.drawRoundRect(new RectF(rect), radius, radius, paint);
		} else {
			context.drawRect(rect, paint);
		}
	}

	private URL generateURL(String baseURL, Map<String, String> params)
			throws MalformedURLException {

		StringBuilder sb = new StringBuilder(baseURL);
		Iterator<Entry<String, String>> it = params.entrySet().iterator();
		if (it.hasNext()) {
			sb.append('?');
		}
		while (it.hasNext()) {
			Entry<String, String> entry = it.next();
			sb.append(entry.getKey());
			sb.append('=');
			sb.append(CcUtil.encode(entry.getValue()));
			if (it.hasNext()) {
				sb.append('&');
			}
		}
		return new URL(sb.toString());
	}

	private String generatePostBody(Map<String, String> params) {
		StringBuilder body = new StringBuilder();
		StringBuilder endLine = new StringBuilder("\r\n--").append(
				STRING_BOUNDARY).append("\r\n");

		body.append("--").append(STRING_BOUNDARY).append("\r\n");

		for (Entry<String, String> entry : params.entrySet()) {
			body.append("Content-Disposition: form-data; name=\"").append(
					entry.getKey()).append("\"\r\n\r\n");
			String value = entry.getValue();
			if ("user_message_prompt".equals(entry.getKey())) {
				body.append(value);
			} else {
				body.append(CcUtil.encode(value));
			}

			body.append(endLine);
		}

		return body.toString();
	}

	private void postDismissCleanup() {
		mContext.finish();
	}

	private void dismiss(boolean animated) {
		dialogWillDisappear();
		mLoadingURL = null;
		if (animated) {

			AlphaAnimation animation = new AlphaAnimation(1, 0);
			animation.setDuration(kTransitionDuration);

			postDismissCleanup();
			startAnimation(animation);
		} else {
			postDismissCleanup();
		}
	}

	public FBDialog(Activity context, FBSession session) {
		super(context);

		mContext = context;
		mDelegate = null;
		// XXX different flow?!!
		mSession = session;// null;

		mLoadingURL = null;

		// http://groups.google.com/group/android-developers/browse_thread/thread/a0b71c59fb33b94a/5d996451f43f507b?lnk=gst&q=ondraw#5d996451f43f507b
		setWillNotDraw(false);

		int contentPadding = kPadding + kBorderWidth;
		setPadding(contentPadding, contentPadding, contentPadding,
				contentPadding);

		// main content of popup window
		mContent = new LinearLayout(context);
		mContent.setOrientation(LinearLayout.VERTICAL);
		mContent.setBackgroundColor(Color.WHITE);
		mContent.setLayoutParams(new LayoutParams(
				ViewGroup.LayoutParams.FILL_PARENT,
				ViewGroup.LayoutParams.FILL_PARENT));

		RelativeLayout title = new RelativeLayout(context);
		title.setLayoutParams(new LayoutParams(
				ViewGroup.LayoutParams.FILL_PARENT,
				ViewGroup.LayoutParams.WRAP_CONTENT));

		mTitleLabel = new TextView(context);
		mTitleLabel.setText(DEFAULT_TITLE);
		mTitleLabel.setBackgroundColor(FACEBOOK_BLUE);
		mTitleLabel.setTextColor(Color.WHITE);
		mTitleLabel.setTypeface(Typeface.DEFAULT_BOLD);
		mTitleLabel.setPadding(kTitleMarginX, kTitleMarginY, kTitleMarginX,
				kTitleMarginY);
		mTitleLabel.setLayoutParams(new LayoutParams(
				ViewGroup.LayoutParams.FILL_PARENT,
				ViewGroup.LayoutParams.WRAP_CONTENT));

		// FB icon on the left side of the dialog title
		Drawable iconDrawable = CcUtil.getDrawable(getClass(),
				"ti/modules/titanium/facebook/resources/fbicon.png");

		// close icon on the right side of the dialog title
		Drawable closeDrawable = CcUtil.getDrawable(getClass(),
				"ti/modules/titanium/facebook/resources/close.png");

		// FB icon is part of TextWiev
		mTitleLabel.setCompoundDrawablePadding(5); // TODO - check correct
		// padding
		mTitleLabel.setCompoundDrawablesWithIntrinsicBounds(iconDrawable, null,
				null, null);
		title.addView(mTitleLabel);

		// close icon is on standalone button, next to title TextView
		mCloseButton = new ImageButton(context);
		mCloseButton.setBackgroundColor(Color.TRANSPARENT);
		mCloseButton.setImageDrawable(closeDrawable);
		mCloseButton.setOnTouchListener(new OnTouchListener() {
			public boolean onTouch(View view, MotionEvent event) {
				int action = event.getAction();
				switch (action) {
				case MotionEvent.ACTION_DOWN:
					mTitleLabel.setBackgroundColor(BORDER_GRAY);
					return true;
				case MotionEvent.ACTION_UP:
					mTitleLabel.setBackgroundColor(FACEBOOK_BLUE);
					dismiss(true);
					return true;
				}
				return false;
			}
		});
		RelativeLayout.LayoutParams lp = new RelativeLayout.LayoutParams(
				RelativeLayout.LayoutParams.WRAP_CONTENT,
				RelativeLayout.LayoutParams.WRAP_CONTENT);
		lp.addRule(RelativeLayout.ALIGN_PARENT_RIGHT);
		title.addView(mCloseButton, lp);

		mContent.addView(title);

		mWebView = new WebView(context);
		mWebView.setLayoutParams(new LayoutParams(
				ViewGroup.LayoutParams.FILL_PARENT,
				ViewGroup.LayoutParams.FILL_PARENT));
		mWebView.setWebViewClient(new WebViewClientImpl());

		WebSettings webSettings = mWebView.getSettings();
		webSettings.setJavaScriptEnabled(true);
		webSettings.setDefaultTextEncodingName("UTF-8");
		webSettings.setUserAgentString(FacebookModule.USER_AGENT);

		mContent.addView(mWebView);

		addView(mContent);
	}

	// /////////////////////////////////////////////////////////////////////////////////////////////////
	// View

	protected void onDraw(Canvas canvas) {
		super.onDraw(canvas);

		Rect canvasClipBounds = new Rect(canvas.getClipBounds());

		Rect grayRect = new Rect(canvasClipBounds);
		grayRect.inset(kPadding, kPadding);
		drawRect(canvas, grayRect, BORDER_GRAY, 10f);
	}

	// /////////////////////////////////////////////////////////////////////////////////////////////////
	// WebViewClient

	private final class WebViewClientImpl extends WebViewClient {

		@Override
		public boolean shouldOverrideUrlLoading(WebView view, String url) {
			URI uri;
			try {
				uri = new URI(url);

				// see issue #2
				if (!uri.isAbsolute()) {
					Log.e(LOG,
									"Something went wrong. You probably forgot to specify API key and secret?");
					// I don't return false from here, because I prefer nasty
					// NPE over 'Page not available' message in browser
				}

				// fbconnect is not always the scheme but sometimes after
				// hostname
				if (uri.getScheme().equals("fbconnect"))
                {
                    if (uri.getRawSchemeSpecificPart().equals("cancel"))
                    {
                    	dismissWithSuccess(false, true);
                    }
                    else
                    {
                        dialogDidSucceed(uri);
                    }
                    return true;
                } else if (mLoadingURL.toExternalForm().equals(url)) {
					return false;
				} else {
					if (mDelegate != null
							&& !mDelegate.dialogShouldOpenUrlInExternalBrowser(
									FBDialog.this, uri.toURL())) {
						return true;
					}
					return false;
				}
			} catch (URISyntaxException e) {
				e.printStackTrace();
			} catch (MalformedURLException e) {
				e.printStackTrace();
			}
			return false;
		}

		public void onPageStarted(WebView view, String url, Bitmap favicon) {
			super.onPageStarted(view, url, favicon);

			FBProgressDialog.show(FBDialog.this.getContext(), null);
		}

		@Override
		public void onPageFinished(WebView view, String url) 
		{
			boolean done = false;
			
			if (mLoadingURL!=null)
			{
				String target = mLoadingURL.toExternalForm();
				int idx = target.indexOf('?');
				if (idx != -1)
				{
					target = target.substring(0,idx);
				}
				done = url.equals(target); 
			}
			
			if (!done)
			{
				// Make sure we handle buttons which cancel the current activity
				// correctly. For the login and feed activities, the button id
				// is 'cancel'. For the permission activity, the button id is
				// 'notallow_button'.
				view.loadUrl("javascript:(function(){"
						+ "for (var id in buttonIds = new Array("
						+ "'notallow_button'," + "'cancel'))"
						+ "if (document.getElementById(buttonIds[id]))"
						+ "document.getElementById(buttonIds[id]).onclick ="
						+ "function onclick(event) { "
						+ "window.location.href = 'fbconnect:cancel'; }" + "})()");
			}
			
			super.onPageFinished(view, url);
			FBProgressDialog.hide(FBDialog.this.getContext());
			
			if (done)
			{
				dismiss(true);
			}
		}

	}

	public String getTitle() {
		return mTitleLabel.getText().toString();
	}

	public void setTitle(String title) {
		mTitleLabel.setText(title);
	}

	public void show() {
		load();
	}

	protected void dismissWithSuccess(boolean success, boolean animated) {
		if (mDelegate != null) {
			if (success) {
				mDelegate.dialogDidSucceed(this);
			} else {
				mDelegate.dialogDidCancel(this);
			}
		}
		dismiss(animated);
	}

	protected void dismissWithError(Throwable error, boolean animated) {
		mDelegate.dialogDidFailWithError(this, error);
		dismiss(animated);
	}

	protected void load() {
		// Intended for subclasses to override
	}

	protected void loadURL(String url, String method,
			Map<String, String> getParams, Map<String, String> postParams)
			throws MalformedURLException {

		// Be sure to accept cookies (facebook asks for this)
		CookieManager cookieManager = CookieManager.getInstance();
		cookieManager.setAcceptCookie(true);

		// Create the url
		mLoadingURL = generateURL(url, getParams);

		if (method.equals("GET")) {
			// For get requests we just load the URL
			mWebView.loadUrl(mLoadingURL.toExternalForm());
		} else {
			// For post requests we need to set some properties of
			// the connection so we use an HttpURLConnection. If
			// the method is anything other than GET or POST we'll
			// try to load it anyway, since otherwise we might get
			// stuck waiting for a page to load.
			HttpURLConnection conn = null;
			OutputStream out = null;
			InputStream in = null;

			try {
				conn = (HttpURLConnection) mLoadingURL.openConnection();
				conn.setDoOutput(true);
				conn.setDoInput(true);
				conn.setConnectTimeout(15000);
				conn.setRequestProperty("User-Agent", FacebookModule.USER_AGENT);
				conn.setRequestMethod("POST");
				conn.setRequestProperty("Content-Type",
						"multipart/form-data; boundary=" + STRING_BOUNDARY);
				conn.setRequestProperty("Cookie", cookieManager.getCookie(url));
				conn.connect();
				out = conn.getOutputStream();
				String body = generatePostBody(postParams);
				if (body != null) {
					out.write(body.getBytes("UTF-8"));
				}
				in = conn.getInputStream();
				String response = CcUtil.getResponse(in).toString();
				URI uri = new URI(url);

				mWebView.loadDataWithBaseURL("http://" + uri.getHost(),
						response, "text/html", "UTF-8", "http://"
								+ uri.getHost());
			} catch (IOException e) {
				Log.e(LOG, "IO Exception while opening page", e);
			} catch (URISyntaxException e) {
				Log.e(LOG, "URL syntax exception", e);
			} finally {
				CcUtil.close(in);
				CcUtil.close(out);
				CcUtil.disconnect(conn);
			}
		}
	}

	protected void dialogWillAppear() {
	}

	protected void dialogWillDisappear() {
	}

	protected void dialogDidSucceed(URI uri) {
		dismissWithSuccess(true, true);
	}

	public static abstract class FBDialogDelegate implements IDialogDelegate {

		/**
		 * Called when the dialog succeeds and is about to be dismissed.
		 */
		public void dialogDidSucceed(FBDialog dialog) {
		}

		/**
		 * Called when the dialog is cancelled and is about to be dismissed.
		 */
		public void dialogDidCancel(FBDialog dialog) {
		}

		/**
		 * Called when dialog failed to load due to an error.
		 */
		public void dialogDidFailWithError(FBDialog dialog, Throwable error) {
		}

		/**
		 * Asks if a link touched by a user should be opened in an external
		 * browser.
		 * 
		 * If a user touches a link, the default behavior is to open the link in
		 * the Safari browser, which will cause your app to quit. You may want
		 * to prevent this from happening, open the link in your own internal
		 * browser, or perhaps warn the user that they are about to leave your
		 * app. If so, implement this method on your delegate and return NO. If
		 * you warn the user, you should hold onto the URL and once you have
		 * received their acknowledgement open the URL yourself using
		 * [[UIApplication sharedApplication] openURL:].
		 */
		public boolean dialogShouldOpenUrlInExternalBrowser(FBDialog dialog,
				URL url) {
			return false;
		}

	}

	// ///////////////////////////////////////////
	public void onStart() {
		Log.d(LOG, "FBDialog onStart");
		this.show();
	}

	public void onRestart() {
		Log.d(LOG, "FBDialog onRestart");
	}

	protected void onResume() {
		Log.d(LOG, "FBDialog onResume");
	}

	protected void onPause() {
		Log.d(LOG, "FBDialog onPause");
	}

	protected void onStop() {
		Log.d(LOG, "FBDialog onStop");
	}

	protected void onDestroy() {
		Log.d(LOG, "FBDialog onDestroy");
		if (mWebView != null) {
			mWebView.destroy();
		}
	}
}

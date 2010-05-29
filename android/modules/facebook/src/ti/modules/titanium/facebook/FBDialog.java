/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.facebook;


import java.lang.ref.WeakReference;
import java.net.MalformedURLException;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URL;
import java.util.Iterator;
import java.util.Map;
import java.util.Map.Entry;

import ti.modules.titanium.facebook.FacebookModule;
import ti.modules.titanium.facebook.FBRequest.FBRequestDelegate;

import org.apache.http.impl.cookie.BasicClientCookie;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.Log;

import org.json.JSONObject;

import android.app.Activity;
import android.app.ProgressDialog;
import android.content.Intent;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Rect;
import android.graphics.RectF;
import android.graphics.Typeface;
import android.graphics.drawable.Drawable;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.animation.AlphaAnimation;
import android.webkit.CookieManager;
import android.webkit.CookieSyncManager;
import android.webkit.WebChromeClient;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.ImageButton;
import android.widget.LinearLayout;
import android.widget.RelativeLayout;
import android.widget.TextView;

/**
 * Base Facebook Dialog class
 */
public abstract class FBDialog extends FrameLayout
{
    private static final String LOG = FBDialog.class.getSimpleName();
    private static final boolean DBG = TiConfig.LOGD;

    private static final String DEFAULT_TITLE = "Connect to Facebook";
    private static final int FACEBOOK_COLOR_BLUE = FBUtil.rgbFloatToInt(0.42578125f, 0.515625f, 0.703125f, 1.0f);
    private static final int FACEBOOK_COLOR_GRAY = FBUtil.rgbFloatToInt(0.3f, 0.3f, 0.3f, 0.8f);

    private static final int TRANSITION_DURATION_IN_MS = 200;
    private static final int TITLE_MARGIN_X = 8;
    private static final int TITLE_MARGIN_Y = 4;
    private static final int PADDING = 10;
    private static final int BORDER_WIDTH = 10;


    protected FacebookModule facebookModule;
    private FBDialogDelegate delegate;
    private URL loadingURL;
    private TextView titleLabel;
    private ImageButton closeButton;
    private LinearLayout content;
    private ProgressDialog progressDialog;
    private FBRequest request;

    protected FBSession session;
    protected WebView webView;
    protected WeakReference<Activity> weakContext;

    public FBSession getSession()
    {
        return session;
    }

    public void setSession(FBSession session)
    {
        this.session = session;
    }

    public FBDialogDelegate getDelegate()
    {
        return delegate;
    }

    public void setDelegate(FBDialogDelegate delegate)
    {
        this.delegate = delegate;
    }

    public URL getURL()
    {
        return this.loadingURL;
    }

    private void drawRect(Canvas context, Rect rect, int fillColor, float radius)
    {
        Paint paint = new Paint();
        paint.setStyle(Paint.Style.FILL);
        paint.setColor(fillColor);
        paint.setAntiAlias(true);
        if (radius > 0)
        {
            context.drawRoundRect(new RectF(rect), radius, radius, paint);
        }
        else
        {
            context.drawRect(rect, paint);
        }
    }

    private URL generateURL(String baseURL, Map<String, String> params)
            throws MalformedURLException
    {

        StringBuilder sb = new StringBuilder(baseURL);
        Iterator<Entry<String, String>> it = params.entrySet().iterator();
        if (it.hasNext())
        {
            sb.append('?');
        }
        while (it.hasNext())
        {
            Entry<String, String> entry = it.next();
            sb.append(entry.getKey());
            sb.append('=');
            sb.append(FBUtil.encode(entry.getValue()));
            if (it.hasNext())
            {
                sb.append('&');
            }
        }
        return new URL(sb.toString());
    }

    public void onStart()
	 {
		  Log.d(LOG,"FBDialog onStart");
		  this.show();
	 }

	 public void onRestart()
	 {
		  Log.d(LOG,"FBDialog onRestart");
	 }

    protected void onResume()
	 {
		  Log.d(LOG,"FBDialog onResume");
	 }

	 protected void onPause()
	 {
		  Log.d(LOG,"FBDialog onPause");
	 }

	 protected void onStop()
	 {
		  Log.d(LOG,"FBDialog onStop");
	 }

	 protected void onDestroy()
	 {
		  Log.d(LOG,"FBDialog onDestroy");
		  if (webView != null) {
			  webView.destroy();
		  }
	 }

    private void postDismissCleanup()
    {
		if (DBG) Log.w(LOG,"postDimissCleanup");
		if (weakContext==null) return;
		final Activity context = weakContext.get();
		if (context!=null)
		{
			int uid = context.getIntent().getIntExtra("uid",0);
			session = null;
			this.weakContext.clear();
			this.weakContext = null;
			context.finish();
		}
    }

    private void dismiss(boolean animated)
    {
        dialogWillDisappear();
        loadingURL = null;
        if (animated)
        {
            AlphaAnimation animation = new AlphaAnimation(1, 0);
            animation.setDuration(TRANSITION_DURATION_IN_MS);

            startAnimation(animation);
            postDismissCleanup();
        }
        else
        {
            postDismissCleanup();
        }
    }

    public FBDialog(Activity context, FBSession session, FacebookModule facebookModule)
    {
        super(context);

        this.weakContext = new WeakReference<Activity>(context);
        this.session = session;
        this.facebookModule = facebookModule;

        // http://groups.google.com/group/android-developers/browse_thread/thread/a0b71c59fb33b94a/5d996451f43f507b?lnk=gst&q=ondraw#5d996451f43f507b
        setWillNotDraw(false);

        int contentPadding = PADDING + BORDER_WIDTH;
        setPadding(contentPadding, contentPadding, contentPadding,
                contentPadding);

        content = new LinearLayout(context);
        content.setOrientation(LinearLayout.VERTICAL);
        content.setBackgroundColor(Color.WHITE);
        content.setLayoutParams(new LayoutParams(
                ViewGroup.LayoutParams.FILL_PARENT,
                ViewGroup.LayoutParams.FILL_PARENT));

        RelativeLayout title = new RelativeLayout(context);
        title.setLayoutParams(new LayoutParams(
                ViewGroup.LayoutParams.FILL_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT));


        titleLabel = new TextView(context);
        titleLabel.setText(DEFAULT_TITLE);
        titleLabel.setBackgroundColor(FACEBOOK_COLOR_BLUE);
        titleLabel.setTextColor(Color.WHITE);
        titleLabel.setTypeface(Typeface.DEFAULT_BOLD);
        titleLabel.setPadding(TITLE_MARGIN_X, TITLE_MARGIN_Y, TITLE_MARGIN_X, TITLE_MARGIN_Y);


        titleLabel.setLayoutParams(new LayoutParams(
                ViewGroup.LayoutParams.FILL_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT));

        Drawable iconDrawable = FBUtil.getDrawable(getClass(),
                "ti/modules/titanium/facebook/resources/fbicon.png");

        Drawable closeDrawable = FBUtil.getDrawable(getClass(),
                "ti/modules/titanium/facebook/resources/close.png");

        titleLabel.setCompoundDrawablePadding(5);
        titleLabel.setCompoundDrawablesWithIntrinsicBounds(iconDrawable, null, null, null);
        title.addView(titleLabel);

        closeButton = new ImageButton(context);
        closeButton.setBackgroundColor(Color.TRANSPARENT);
        closeButton.setImageDrawable(closeDrawable);
        closeButton.setOnTouchListener(new OnTouchListener()
        {
            public boolean onTouch(View view, MotionEvent event)
            {
                int action = event.getAction();
                switch (action)
                {
                    case MotionEvent.ACTION_DOWN:
                        titleLabel.setBackgroundColor(FACEBOOK_COLOR_GRAY);
                        dismissWithSuccess(false,true);
                        return true;
                    case MotionEvent.ACTION_UP:
                        titleLabel.setBackgroundColor(FACEBOOK_COLOR_BLUE);
                        return true;
                }
                return false;
            }
        });
        RelativeLayout.LayoutParams lp = new RelativeLayout.LayoutParams(
                RelativeLayout.LayoutParams.WRAP_CONTENT,
                RelativeLayout.LayoutParams.WRAP_CONTENT);
        lp.addRule(RelativeLayout.ALIGN_PARENT_RIGHT);
        title.addView(closeButton, lp);

        content.addView(title);

        progressDialog = new ProgressDialog(context);
        progressDialog.setMessage("Loading...One moment");
        progressDialog.setIndeterminate(true);
        progressDialog.setCancelable(true);

        webView = new WebView(context);
        webView.setLayoutParams(new LayoutParams(
                ViewGroup.LayoutParams.FILL_PARENT,
                ViewGroup.LayoutParams.FILL_PARENT));
        webView.setWebViewClient(new WebViewClientImpl());
        webView.setWebChromeClient(new WebChromeClient(){

			@Override
			public void onProgressChanged(WebView view, int newProgress) {
				super.onProgressChanged(view, newProgress);
				Log.i(LOG,"Progress: " + newProgress);
				if (newProgress>0 && progressDialog.isIndeterminate())
				{
					progressDialog.setIndeterminate(false);
					progressDialog.setMax(100);
				}
				progressDialog.setProgress(newProgress);
			}

        });

        webView.getSettings().setJavaScriptEnabled(true);
        webView.getSettings().setSavePassword(false);

        content.addView(webView);

        CookieSyncManager sm = CookieSyncManager.createInstance(context);
        CookieManager.getInstance().setAcceptCookie(true);

        // FB webservice api requires teset_cookie to exist
        BasicClientCookie cookie = new BasicClientCookie("test_cookie", "1");
        cookie.setPath("/");
        cookie.setDomain(".facebook.com");
        cookie.setSecure(false);
        CookieManager.getInstance().setCookie("http://www.facebook.com", cookie.toString());
        sm.sync();


        addView(content);
    }

    protected void onDraw(Canvas canvas)
    {
        super.onDraw(canvas);
        Rect canvasClipBounds = new Rect(canvas.getClipBounds());
        Rect grayRect = new Rect(canvasClipBounds);
        grayRect.inset(PADDING, PADDING);
        drawRect(canvas, grayRect, FACEBOOK_COLOR_GRAY, 10f);
    }

    private final class WebViewClientImpl extends WebViewClient
    {

        @Override
        public boolean shouldOverrideUrlLoading(WebView view, String url)
        {
            URI uri;
            try
            {
                uri = new URI(url);

				Log.d(LOG,"shouldOverrideUrlLoad for "+url);

                if (!uri.isAbsolute())
                {
                    //FIXME: what to do?
                    Log.e(LOG,"Invalid URL returned from Facebook: "+url);
                }

                if (uri.getScheme().equals("fbconnect"))
                {
                    if (uri.getRawSchemeSpecificPart().equals("cancel"))
                    {
                        dialogDidCancel(uri);
                    }
                    else
                    {
                        dialogDidSucceed(uri);
                    }
                    return true;
                }
                else if (loadingURL.toExternalForm().equals(url))
                {
                    return false;
                }
                else
                {
                    if (delegate!=null && !delegate.shouldOpenURLInExternalBrowser(
                            FBDialog.this, uri.toURL()))
                    {
                        return true;
                    }

//                    // open in external browser
//                    Intent i = new Intent( Intent.ACTION_VIEW, Uri.parse(url));
//                    i.addFlags( Intent.FLAG_ACTIVITY_NEW_TASK);
//                    view.getContext().startActivity(i);
                    return false;
                }
            }
            catch (URISyntaxException e)
            {
                Log.e(LOG,"Syntax exception in "+url,e);
            }
            catch (MalformedURLException e)
            {
                Log.e(LOG,"Malformed URL exception in "+url,e);
            }
            return false;
        }

        @Override
        public void onPageFinished(WebView view, String url)
        {
            Log.d(LOG,"LOADED WEBVIEW = "+url);

            super.onPageFinished(view, url);

            if (progressDialog!=null)
            {
                progressDialog.dismiss();
            }

			if (url.indexOf("fbconnect:success")==-1)
			{
            	FBDialog.this.setVisibility(VISIBLE);
			}
        }

		@Override
		public void onReceivedError(WebView view, int errorCode,
				String description, String failingUrl)
		{
			Log.e("FBDialog", "Received Error: " + errorCode + " msg=" + description);
			super.onReceivedError(view, errorCode, description, failingUrl);
		}

    }

    public String getTitle()
    {
        return titleLabel.getText().toString();
    }

    public void setTitle(String title)
    {
        titleLabel.setText(title);
    }

    public void show()
    {
        this.setVisibility(INVISIBLE);
        progressDialog.show();
        load();
    }

    protected void dismissWithSuccess(boolean success, boolean animated)
    {
		Log.d(LOG,"dismissWithSuccess - success="+success+",animated="+animated);

		// make sure this is set here since this can be called from within adapters as well
		if (weakContext!=null)
		{
			Activity context = weakContext.get();		
			if (context!=null)
			{
				context.setResult( success ? Activity.RESULT_OK : Activity.RESULT_CANCELED, context.getIntent());
			}
		}
		if (request!=null)
		{
			try
			{
				request.cancel();
			}
			catch(Exception ig)
			{
			}
			request = null;
		}
        if (delegate != null)
        {
            if (success)
            {
                delegate.dialogDidSucceed(this);
            }
            else
            {
                delegate.dialogDidCancel(this);
            }
        }
        dismiss(animated);
    }

    protected void dismissWithError(Throwable error, boolean animated)
    {
		Log.w(LOG,"dismissWithError",error);
		if (weakContext==null) return;
		Activity context = weakContext.get();
		if (context!=null)
		{
			Intent data = new Intent();
			data.putExtra("message",error.getMessage());
			data.putExtra("error",true);
			context.setResult(Activity.RESULT_CANCELED, data);

			Log.w(LOG, "Facebook Dialog received error",error);
			if (delegate!=null)
			{
				delegate.didFailWithError(this, error);
			}
			dismiss(animated);
		}
    }

    protected void load()
    {
    }

    protected Object beforeLoad(URL url, String contentType, Object content)
    {
        try
        {
			 if (contentType!=null && contentType.indexOf("html")!=-1)
			 {
				   String html = content.toString();
				   if (html.length()!=0)
					{
						Log.d(LOG,"FACEBOOK HTML = "+html);
				 		StringBuilder sb = new StringBuilder(64000);
					 	sb.append(content);
					 	sb.append("<script>");
			       		sb.append("document.getElementById('cancel').ontouchstart = function() { window.location.href='fbconnect:cancel'; return false; };");
						sb.append("</script>");
		          		return sb;
					}
			  }
        }
        catch (Exception e)
        {
            Log.e(LOG,"Error loading resources",e);
        }
        return content;
    }

    protected void afterLoad(URL url, String contentType, Object content)
    {
        // for subclasses
    }

    protected void injectData(String contentType, String content)
    {
        webView.loadDataWithBaseURL(loadingURL.toExternalForm(), content, contentType, "utf-8", null);
    }

    protected void loadURL(String url, String method,
            Map<String, String> getParams, final Map<String, String> postParams)
            throws MalformedURLException
    {
		loadingURL = generateURL(url, getParams);

		if (request!=null)
		{
			request.cancel();
		}

		Log.d(LOG,"Loading URL: "+loadingURL+" ("+method+")");

        if (method.equalsIgnoreCase("get"))
        {
            // we have to load GET requests over HTTP client and then inject in to
            // the webview
            request = FBRequest.requestWithDelegate(new FBRequestDelegate()
            {
                protected void request_didFailWithError(FBRequest request, Throwable error)
                {
                    FBDialog.this.dismissWithError(error, true);
                }
                protected void request_didLoad(FBRequest request, String contentType, Object result)
                {
					Log.d(LOG,"GET URL response received: "+contentType);

                    // give it to subclass in case they want to transform content
                    result = FBDialog.this.beforeLoad(loadingURL, contentType, result);

					Log.d(LOG,"HTML = "+result);

                    // we hard code content type since it appears that the result of contentType doesn't jive
                    // and we'd have to parse out to encoding ... however, we know what it is...
                    webView.loadDataWithBaseURL(loadingURL.toExternalForm(), result.toString(), "text/html", "utf-8", null);

                    FBDialog.this.afterLoad(loadingURL, contentType, result);
                }
            });
            new Thread() 
			{
				@Override
				public void run() {
		            request.get(loadingURL.toExternalForm());
				}
            }.start();
        }
        else
        {
            // we have to load POST requests over HTTP client and then inject in to
            // the webview
            request = FBRequest.requestWithDelegate(new FBRequestDelegate()
            {
                protected void request_didFailWithError(FBRequest request, Throwable error)
                {
                    FBDialog.this.dismissWithError(error, true);
                }
                protected void request_didLoad(FBRequest request, String contentType, Object result)
                {
					Log.d(LOG,"POST URL response received: "+contentType);

                    result = FBDialog.this.beforeLoad(loadingURL, contentType, result);

                    // we hard code content type since it appears that the result of contentType doesn't jive
                    // and we'd have to parse out to encoding ... however, we know what it is...
                    webView.loadDataWithBaseURL(loadingURL.toExternalForm(), result.toString(), "text/html", "utf-8", null);

                    FBDialog.this.afterLoad(loadingURL, contentType, result);
                }
            });

            new Thread() 
			{
				@Override
				public void run() 
				{
		            request.post(loadingURL.toExternalForm(), postParams);
				}
            }.start();

        }
    }

    protected void dialogWillAppear()
    {
    }

    protected void dialogWillDisappear()
    {
    }

    protected void dialogDidSucceed(URI uri)
    {
		Log.d(LOG,"dialogDidSucceed="+uri);
        dismissWithSuccess(true, true);
    }

    protected void dialogDidCancel(URI uri)
    {
		Log.d(LOG,"dialogDidCancel="+uri);
        dismissWithSuccess(false, true);
    }

    public static abstract class FBDialogDelegate
    {

        /**
         * Called when the dialog succeeds and is about to be dismissed.
         */
        protected void dialogDidSucceed(FBDialog dialog)
        {
        }

        /**
         * Called when the dialog is cancelled and is about to be dismissed.
         */
        protected void dialogDidCancel(FBDialog dialog)
        {
        }

        /**
         * Called when dialog failed to load due to an error.
         */
        protected void didFailWithError(FBDialog dialog, Throwable error)
        {
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
        protected boolean shouldOpenURLInExternalBrowser(FBDialog dialog,
                URL url)
        {
            return false;
        }

    }

}
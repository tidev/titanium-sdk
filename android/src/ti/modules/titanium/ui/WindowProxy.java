package ti.modules.titanium.ui;

import java.lang.ref.WeakReference;
import java.util.ArrayList;

import org.appcelerator.titanium.TiActivity;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiUIView;
import org.appcelerator.titanium.view.TiViewProxy;
import org.appcelerator.titanium.view.TiWindowProxy;
import org.json.JSONObject;

import android.app.Activity;
import android.content.Intent;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewGroup.LayoutParams;

/*
 * @interface TiUIWindowProxy : TiWindowProxy
{
@private
	NSURL *url;
	NSMutableArray *views;
	TiViewProxy *activeView;
	KrollBridge *context;
	BOOL hasToolbar;
	BOOL focused;
}

-(void)addView:(id)args;
-(void)removeView:(id)args;
-(void)showView:(id)args;


 */
public class WindowProxy extends TiWindowProxy
{
	private static final String LCAT = "WindowProxy";
	private static final boolean DBG = TiConfig.LOGD;

	private String url;
	ArrayList<TiViewProxy> views;
	TiViewProxy activeView;
	WeakReference<Activity> weakActivity;

	public WindowProxy(TiContext tiContext, Object[] args)
	{
		super(tiContext, args);
	}

	@Override
	protected void handleOpen(TiDict options)
	{
		Log.i(LCAT, "handleOpen");

		// Check for type of Window
		TiDict props = getDynamicProperties();
		Activity activity = getTiContext().getActivity();

		if (requiresActivity(props))
		{
			Intent intent = new Intent(activity, TiActivity.class);

			if (props.containsKey("fullscreen")) {
				intent.putExtra("fullscreen", TiConvert.toBoolean(props, "fullscreen"));
			}
			if (props.containsKey("navBarHidden")) {
				intent.putExtra("navBarHidden", TiConvert.toBoolean(props, "navBarHidden"));
			}
			if (props.containsKey("url")) {
				intent.putExtra("url", TiConvert.toString(props, "url"));
			}

			intent.putExtra("finishRoot", activity.isTaskRoot());
			intent.putExtra("proxyId", proxyId);
			getTiContext().getTiApp().registerProxy(this);

			getTiContext().getActivity().startActivity(intent);
		} else {
			TiUIView v = getView(getTiContext().getActivity());
			getTiContext().getActivity().addContentView(v.getNativeView(),
					new ViewGroup.LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT));
		}
	}

	private boolean requiresActivity(TiDict options)
	{
		boolean activityRequired = false;

		if (options != null) {
			if (options.containsKey("fullscreen") ||
					options.containsKey("navBarHidden"))
			{
				activityRequired = true;
			}
		}

		return activityRequired;
	}

	public void handlePostOpen(Activity activity)
	{
		TiActivity tia = (TiActivity) activity;
		if (tia != null) {
			weakActivity = new WeakReference<Activity>(activity);
			getView(activity);
		}
	}

	@Override
	protected void handleClose(TiDict options)
	{
		Activity activity = null;
		if (weakActivity != null) {
			activity = weakActivity.get();
		}
		if (activity != null) {
			activity.finish();
			weakActivity = null;
			this.clearView();
		} else {
			TiUIView tiv = peekView();
			if (tiv != null) {
				View v = tiv.getNativeView();
				if (v != null) {
					int vid = v.getId();

					View mv = getTiContext().getActivity().findViewById(vid);
					if (mv != null) {
						Log.i(LCAT, "WE HERE");
					}
				}
			}
		}
	}

	@Override
	public TiUIView createView(Activity activity)
	{
		if (activity instanceof TiActivity) {
			return new TiUIWindow(this, (TiActivity) activity);
		} else {
			return new TiUIWindow(this, null);
		}
	}

	public void addView(TiViewProxy view)
	{
		if (views == null) {
			views = new ArrayList<TiViewProxy>();
		}
		synchronized(views) {
			views.add(view);
		}
	}

	public void removeView(TiViewProxy view)
	{
		if (views != null) {
			synchronized(views) {
				views.remove(view);
			}
		}
	}

	public void showView(TiViewProxy view)
	{

	}

	public void showView(TiViewProxy view, JSONObject options)
	{

	}
}

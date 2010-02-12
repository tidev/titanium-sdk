package ti.modules.titanium.ui;

import java.lang.ref.WeakReference;
import java.util.ArrayList;

import org.appcelerator.titanium.TiActivity;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.proxy.TiWindowProxy;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiUIView;
import org.json.JSONObject;

import android.app.Activity;
import android.content.Intent;

public class WindowProxy extends TiWindowProxy
{
	private static final String LCAT = "WindowProxy";
	private static final boolean DBG = TiConfig.LOGD;

	ArrayList<TiViewProxy> views;
	WeakReference<Activity> weakActivity;
	String windowId;

	public WindowProxy(TiContext tiContext, Object[] args)
	{
		super(tiContext, args);
	}

	@Override
	public TiUIView getView(Activity activity) {
		throw new IllegalStateException("call to getView on a Window");
	}


	@Override
	protected void handleOpen(TiDict options)
	{
		Log.i(LCAT, "handleOpen");

		// Check for type of Window
		TiDict props = getDynamicProperties();
		Activity activity = getTiContext().getActivity();

		Intent intent = new Intent(activity, TiActivity.class);
		fillIntent(intent);

		boolean newActivity = requiresNewActivity(props);
		if (!newActivity && options != null && options.containsKey("tabOpen")) {
			newActivity = TiConvert.toBoolean(options,"tabOpen");
		}

		if (newActivity)
		{
			intent.putExtra("finishRoot", activity.isTaskRoot());
			getTiContext().getTiApp().registerProxy(this);

			getTiContext().getActivity().startActivity(intent);
		} else {
			getTiContext().getTiApp().registerProxy(this);
			windowId = getTiContext().getRootActivity().openWindow(intent);
		}
	}

	public void handlePostOpen(Activity activity)
	{
		TiActivity tia = (TiActivity) activity;
		if (tia != null) {
			weakActivity = new WeakReference<Activity>(activity);
			view = new TiUIWindow(this, (TiActivity) activity);
			realizeViews(activity, view);
			if (tab == null) {
				getTiContext().getRootActivity().addWindow(windowId, view.getLayoutParams());
			}
		}
		opened = true;
	}

	@Override
	protected void handleClose(TiDict options)
	{
		Log.i(LCAT, "handleClose");
		Activity activity = null;
		if (weakActivity != null) {
			activity = weakActivity.get();
		}
		if (windowId == null) {
			activity.finish();
			weakActivity = null;
			this.clearView();
		} else {
			getTiContext().getRootActivity().closeWindow(windowId);
			releaseViews();
			windowId = null;
			view = null;
		}
		opened = false;
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

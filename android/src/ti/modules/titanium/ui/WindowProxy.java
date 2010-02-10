package ti.modules.titanium.ui;

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
import android.view.ViewParent;
import android.widget.FrameLayout;
import android.widget.FrameLayout.LayoutParams;

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

	public WindowProxy(TiContext tiContext, Object[] args)
	{
		super(tiContext, args);
	}

	@Override
	protected void handleOpen(TiDict options)
	{
		Log.i(LCAT, "handleOpen");

		Activity activity = getTiContext().getActivity();
		Intent intent = new Intent(activity, TiActivity.class);
		if (options != null) {

			if (options.containsKey("fullscreen")) {
				intent.putExtra("fullscreen", TiConvert.toBoolean(options, "fullscreen"));
			}
			if (options.containsKey("navBarHidden")) {
				intent.putExtra("navBarHidden", TiConvert.toBoolean(options, "navBarHidden"));
			}
			if (options.containsKey("url")) {
				intent.putExtra("url", TiConvert.toString(options, "url"));
			}
		}

		intent.putExtra("finishRoot", activity.isTaskRoot());
		intent.putExtra("proxyId", proxyId);
		getTiContext().getTiApp().registerProxy(this);

		getTiContext().getActivity().startActivity(intent);


		//TODO ignore multiple opens
//		TiUIView v = getView();
//		Activity a = getTiContext().getActivity();
//		if (a instanceof TiActivity) {
//			TiActivity tia = (TiActivity) a;
//			tia.getLayout().addView(v.getNativeView());
//		} else {
//			a.addContentView(v.getNativeView(), new FrameLayout.LayoutParams(LayoutParams.FILL_PARENT, LayoutParams.FILL_PARENT));
//		}

	}

	public void handlePostOpen(Activity activity)
	{
		TiActivity tia = (TiActivity) activity;
		if (tia == null) {
			//TiUIView v = getView();
		} else {
			getView(activity);
		}
	}

	@Override
	protected void handleClose(TiDict options)
	{
//		if (peekView() != null) {
//			TiUIView v = getView();
//			ViewParent p =v.getNativeView().getParent();
//			Activity a= getTiContext().getActivity();
//			if (a instanceof TiActivity) {
//				TiActivity tia = (TiActivity) a;
//				tia.getLayout().removeViewInLayout(v.getNativeView());
//			} else {
//				a.finish();
//			}
//		}
	}

	@Override
	public TiUIView createView(Activity activity)
	{
		return new TiUIWindow(this, (TiActivity) activity);
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

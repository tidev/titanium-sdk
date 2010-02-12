package ti.modules.titanium.ui;

import java.lang.ref.WeakReference;
import java.util.ArrayList;
import java.util.concurrent.atomic.AtomicInteger;

import org.appcelerator.titanium.TiActivity;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.proxy.TiWindowProxy;
import org.appcelerator.titanium.util.AsyncResult;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiFileHelper;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.widget.TiUITabGroup;
import android.app.Activity;
import android.content.Intent;
import android.graphics.drawable.Drawable;
import android.os.Message;
import android.widget.TabHost.TabSpec;

public class TabGroupProxy extends TiWindowProxy
{
	private static final String LCAT = "TabGroupProxy";
	private static boolean DBG = TiConfig.LOGD;

	private static final int MSG_FIRST_ID = TiWindowProxy.MSG_LAST_ID + 1;

	private static final int MSG_ADD_TAB = MSG_FIRST_ID + 100;
	private static final int MSG_REMOVE_TAB = MSG_FIRST_ID + 101;

	protected static final int MSG_LAST_ID = MSG_FIRST_ID + 999;

	private ArrayList<TabProxy> tabs;
	private AtomicInteger idGenerator;
	private TiTabActivity tta;
	WeakReference<Activity> weakActivity;
	String windowId;

	public TabGroupProxy(TiContext tiContext, Object[] args) {
		super(tiContext, args);
		idGenerator = new AtomicInteger(0);
	}

	@Override
	public TiUIView getView(Activity activity) {
		throw new IllegalStateException("call to getView on a Window");
	}

	@Override
	public boolean handleMessage(Message msg)
	{
		switch (msg.what) {
			case MSG_ADD_TAB : {
				AsyncResult result = (AsyncResult) msg.obj;
				handleAddTab((TabProxy) result.getArg());
				result.setResult(null); // signal added
				return true;
			}
			case MSG_REMOVE_TAB : {
				AsyncResult result = (AsyncResult) msg.obj;
				handleRemoveTab((TabProxy) result.getArg());
				result.setResult(null); // signal added
				return true;
			}
			default : {
				return super.handleMessage(msg);
			}
		}
	}

	public void addTab(TabProxy tab)
	{
		if (tabs == null) {
			tabs = new ArrayList<TabProxy>();
		}

		if (getTiContext().isUIThread()) {
			handleAddTab(tab);
			return;
		}

		AsyncResult result = new AsyncResult(tab);
		Message msg = getUIHandler().obtainMessage(MSG_ADD_TAB, result);
		msg.sendToTarget();
		result.getResult(); // Don't care about return, just synchronization.
	}

	private void handleAddTab(TabProxy tab)
	{
		tabs.add(tab);

		if (peekView() != null) {
			TiUITabGroup tg = (TiUITabGroup) getView(getTiContext().getActivity());
			addTabToGroup(tg, tab);
		}
	}

	private void addTabToGroup(TiUITabGroup tg, TabProxy tab)
	{
		String title = (String) tab.getDynamicValue("title");
		String icon = (String) tab.getDynamicValue("icon");
		final TiWindowProxy vp = (TiWindowProxy) tab.getDynamicValue("window");
		vp.setTabProxy(tab);

		if (title != null && vp != null) {
			TabSpec tspec = tg.newTab(title);
			if (icon == null) {
				tspec.setIndicator(title);
			} else {
				String path = getTiContext().resolveUrl(icon);
				TiFileHelper tfh = new TiFileHelper(getTiContext().getRootActivity());
				Drawable d = tfh.loadDrawable(path, false);
				tspec.setIndicator(title, d);
			}

			Intent intent = new Intent(tta, TiActivity.class);
			//intent.putExtra("finishRoot", activity.isTaskRoot());
			intent.putExtra("proxyId", vp.getProxyId());
			getTiContext().getTiApp().registerProxy(vp);

			tspec.setContent(intent);

			tg.addTab(tspec);
		}

	}

	public void removeTab(TabProxy tab)
	{

	}

	public void handleRemoveTab(TabProxy tab) {

	}

	@Override
	protected void handleOpen(TiDict options)
	{
		//TODO skip multiple opens?
		Log.i(LCAT, "handleOpen");

		TiDict props = getDynamicProperties();
		Activity activity = getTiContext().getActivity();
		Intent intent = new Intent(activity, TiTabActivity.class);
		fillIntent(intent);

		if (requiresNewActivity(props))
		{
			intent.putExtra("finishRoot", activity.isTaskRoot());
			getTiContext().getTiApp().registerProxy(this);
			getTiContext().getActivity().startActivity(intent);
		} else {
			getTiContext().getTiApp().registerProxy(this);
			windowId = getTiContext().getRootActivity().openWindow(intent);
			Log.d(LCAT, "WindowID: " + windowId);
		}
	}

	public void handlePostOpen(Activity activity)
	{
		this.tta = (TiTabActivity) activity; //TODO leak?
		TiUITabGroup tg = tta.getTabGroup();
		view = tg;
		if (tabs != null) {
			for(TabProxy tab : tabs) {
				addTabToGroup(tg, tab);
			}
		}
		getTiContext().getRootActivity().addWindow(windowId, view.getLayoutParams());
		opened = true;
	}

	@Override
	protected void handleClose(TiDict options) {
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

	public TiDict buildFocusEvent(String to, String from)
	{
		int toIndex = indexForId(to);
		int fromIndex = indexForId(from);

		TiDict e = new TiDict();

		e.put("index", toIndex);
		e.put("previousIndex", fromIndex);

		if (fromIndex != -1) {
			e.put("previousTab", tabs.get(fromIndex));
		} else {
			TiDict fakeTab = new TiDict();
			fakeTab.put("title", "no tab");
			e.put("previousTab", fakeTab);
		}

		if (toIndex != -1) {
			e.put("tab", tabs.get(toIndex));
		}

		return e;
	}

	private int indexForId(String id) {
		int index = -1;

		int i = 0;
		for(TabProxy t : tabs) {
			String title = (String) t.getDynamicValue("title");
			if (title.equals(id)) {
				index = i;
				break;
			}
			i += 1;
		}

		return index;
	}
}

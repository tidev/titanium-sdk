package ti.modules.titanium.ui;

import java.util.ArrayList;
import java.util.concurrent.atomic.AtomicInteger;

import org.appcelerator.titanium.TiActivity;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.util.AsyncResult;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.view.TiUIView;
import org.appcelerator.titanium.view.TiWindowProxy;

import ti.modules.titanium.ui.widget.TiUITabGroup;
import android.app.Activity;
import android.os.Message;
import android.view.View;
import android.widget.FrameLayout;
import android.widget.FrameLayout.LayoutParams;
import android.widget.TabHost.TabContentFactory;
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

	public TabGroupProxy(TiContext tiContext, Object[] args) {
		super(tiContext, args);
		idGenerator = new AtomicInteger(0);
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

	@Override
	public TiUIView createView() {
		return new TiUITabGroup(this);
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
			TiUITabGroup tg = (TiUITabGroup) getView();
			addTabToGroup(tg, tab);
		}
	}

	private void addTabToGroup(TiUITabGroup tg, TabProxy tab)
	{
		String title = (String) tab.getDynamicValue("title");
		String icon = (String) tab.getDynamicValue("icon");
		final TiWindowProxy vp = (TiWindowProxy) tab.getDynamicValue("window");

		if (title != null && vp != null) {
			TabSpec tspec = tg.newTab(title);
			tspec.setIndicator(title);

			TabContentFactory factory = new TabContentFactory(){

				public View createTabContent(String id) {
					TiUIView tv = vp.getView();
					View v = tv.getNativeView();

					if (v.getId() == View.NO_ID) {
						v.setId(idGenerator.incrementAndGet());
					}

					return v;
				}
			};
			tspec.setContent(factory);

			tg.addTab(tspec);
		}

	}

	public void removeTab(TabProxy tab)
	{

	}

	public void handleRemoveTab(TabProxy tab) {

	}

	@Override
	protected void handleOpen()
	{
		//TODO, need an Activity for this like Window.
		//TODO skip multiple opens?
		Log.i(LCAT, "handleOpen");
		TiUITabGroup tg = (TiUITabGroup) getView();
		Activity a = getTiContext().getActivity();
		if (a instanceof TiActivity) {
			TiActivity tia = (TiActivity) a;
			tia.getLayout().addView(tg.getNativeView());
		} else {
			a.addContentView(tg.getNativeView(), new FrameLayout.LayoutParams(LayoutParams.FILL_PARENT, LayoutParams.FILL_PARENT));
		}

		for(TabProxy tab : tabs) {
			addTabToGroup(tg, tab);
		}


	}

	@Override
	protected void handleClose() {
	}
}

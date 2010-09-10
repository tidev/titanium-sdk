/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import java.lang.ref.WeakReference;
import java.util.ArrayList;
import java.util.concurrent.atomic.AtomicInteger;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiActivity;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.proxy.TiWindowProxy;
import org.appcelerator.titanium.util.AsyncResult;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiFileHelper;
import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.widget.TiUITabGroup;
import android.app.Activity;
import android.content.Intent;
import android.graphics.drawable.Drawable;
import android.os.Message;
import android.os.Messenger;
import android.widget.TabHost.TabSpec;

@Kroll.proxy(creatableInModule=UIModule.class)
public class TabGroupProxy extends TiWindowProxy
{
	private static final String LCAT = "TabGroupProxy";
	private static boolean DBG = TiConfig.LOGD;

	private static final int MSG_FIRST_ID = TiWindowProxy.MSG_LAST_ID + 1;

	private static final int MSG_ADD_TAB = MSG_FIRST_ID + 100;
	private static final int MSG_REMOVE_TAB = MSG_FIRST_ID + 101;
	private static final int MSG_FINISH_OPEN = MSG_FIRST_ID + 102;

	protected static final int MSG_LAST_ID = MSG_FIRST_ID + 999;

	private ArrayList<TabProxy> tabs;
	private AtomicInteger idGenerator;
	private TiTabActivity tta;
	WeakReference<Activity> weakActivity;
	String windowId;

	public TabGroupProxy(TiContext tiContext) {
		super(tiContext);
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
			case MSG_FINISH_OPEN: {
				TiTabActivity activity = (TiTabActivity) msg.obj;
				view = new TiUITabGroup(this, activity);
				modelListener = view;
				handlePostOpen(activity);
				return true;
			}
			default : {
				return super.handleMessage(msg);
			}
		}
	}

	@Kroll.getProperty @Kroll.method
	public TabProxy[] getTabs() {
		TabProxy[] tps = null;

		if (tabs != null) {
			tps = tabs.toArray(new TabProxy[tabs.size()]);
		}

		return tps;
	}

	@Kroll.method
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
			TiUITabGroup tg = (TiUITabGroup) peekView();
			addTabToGroup(tg, tab);
		}
	}

	private void addTabToGroup(TiUITabGroup tg, TabProxy tab)
	{
		String title = (String) tab.getProperty("title");
		String icon = (String) tab.getProperty("icon");
		tab.setTabGroup(this);
		final WindowProxy vp = (WindowProxy) tab.getProperty("window");
		vp.setTabGroupProxy(this);
		vp.setTabProxy(tab);

		if (title != null && vp != null) {
			TabSpec tspec = tg.newTab(title);
			if (icon == null) {
				tspec.setIndicator(title);
			} else {
				String path = getTiContext().resolveUrl(null, icon);
				TiFileHelper tfh = new TiFileHelper(getTiContext().getRootActivity());
				Drawable d = tfh.loadDrawable(path, false);
				tspec.setIndicator(title, d);
			}


			Intent intent = new Intent(tta, TiActivity.class);
			vp.fillIntentForTab(intent);

			tspec.setContent(intent);

			tg.addTab(tspec);
		}

	}

	@Kroll.method
	public void removeTab(TabProxy tab)
	{

	}

	public void handleRemoveTab(TabProxy tab) {

	}
	
	@Kroll.setProperty @Kroll.method @Kroll.runOnUiThread
	public void setActiveTab(Object tab) {
		if (peekView() != null) {
			TiUITabGroup tg = (TiUITabGroup) peekView();
			tg.changeActiveTab(tab);
		}
	}
	
	@Override
	protected void handleOpen(KrollDict options)
	{
		//TODO skip multiple opens?
		Log.i(LCAT, "handleOpen");

		Activity activity = getTiContext().getActivity();
		Intent intent = new Intent(activity, TiTabActivity.class);
		fillIntent(activity, intent);
		activity.startActivity(intent);
	}

	public void handlePostOpen(Activity activity)
	{
		this.tta = (TiTabActivity) activity; //TODO leak?
		TiUITabGroup tg = (TiUITabGroup) view;
		if (tabs != null) {
			for(TabProxy tab : tabs) {
				addTabToGroup(tg, tab);
			}
		}
		getTiContext().getRootActivity().addWindow(windowId, view.getLayoutParams());
		opened = true;
	}

	@Override
	protected void handleClose(KrollDict options) {
		Log.i(LCAT, "handleClose");
		modelListener = null;
		getTiContext().getRootActivity().closeWindow(windowId);
		releaseViews();
		windowId = null;
		view = null;

		opened = false;
	}

	public KrollDict buildFocusEvent(String to, String from)
	{
		int toIndex = indexForId(to);
		int fromIndex = indexForId(from);

		KrollDict e = new KrollDict();

		e.put("index", toIndex);
		e.put("previousIndex", fromIndex);

		if (fromIndex != -1) {
			e.put("previousTab", tabs.get(fromIndex));
		} else {
			KrollDict fakeTab = new KrollDict();
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
			String title = (String) t.getProperty("title");
			if (title.equals(id)) {
				index = i;
				break;
			}
			i += 1;
		}

		return index;
	}

	private void fillIntent(Activity activity, Intent intent)
	{
		KrollDict props = getProperties();

		if (props != null) {
			if (props.containsKey("fullscreen")) {
				intent.putExtra("fullscreen", TiConvert.toBoolean(props, "fullscreen"));
			}
			if (props.containsKey("navBarHidden")) {
				intent.putExtra("navBarHidden", TiConvert.toBoolean(props, "navBarHidden"));
			}
		}
		intent.putExtra("finishRoot", activity.isTaskRoot());
		Messenger messenger = new Messenger(getUIHandler());
		intent.putExtra("messenger", messenger);
		intent.putExtra("messageId", MSG_FINISH_OPEN);
	}
	
	@Override
	public KrollDict handleToImage() {
		return TiUIHelper.viewToImage(getTiContext(), getTiContext().getActivity().getWindow().getDecorView());
	}
}

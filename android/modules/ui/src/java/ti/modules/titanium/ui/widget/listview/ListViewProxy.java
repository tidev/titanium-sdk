/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package ti.modules.titanium.ui.widget.listview;


import java.util.ArrayList;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.AsyncResult;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.kroll.common.TiMessenger;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.UIModule;
import android.app.Activity;
import android.os.Handler;
import android.os.Message;

@Kroll.proxy(creatableInModule = UIModule.class, propertyAccessors = {
	TiC.PROPERTY_HEADER_TITLE,
	TiC.PROPERTY_FOOTER_TITLE,
	TiC.PROPERTY_DEFAULT_ITEM_TEMPLATE,
	TiC.PROPERTY_SHOW_VERTICAL_SCROLL_INDICATOR,
	TiC.PROPERTY_SECTIONS
})
public class ListViewProxy extends TiViewProxy {

	private static final String TAG = "ListViewProxy";
	
	private static final int MSG_FIRST_ID = TiViewProxy.MSG_LAST_ID + 1;

	private static final int MSG_SECTION_COUNT = MSG_FIRST_ID + 399;
	private static final int MSG_SCROLL_TO_ITEM = MSG_FIRST_ID + 400;
	private static final int MSG_APPEND_SECTION = MSG_FIRST_ID + 401;
	private static final int MSG_INSERT_SECTION_AT = MSG_FIRST_ID + 402;
	private static final int MSG_DELETE_SECTION_AT = MSG_FIRST_ID + 403;
	private static final int MSG_REPLACE_SECTION_AT = MSG_FIRST_ID + 404;


	//indicate if user attempts to add/modify/delete sections before TiListView is created 
	private boolean preload = false;
	private ArrayList<ListSectionProxy> preloadSections;
	
	public TiUIView createView(Activity activity) {
		return new TiListView(this, activity);
	}
	
	public void handleCreationArgs(KrollModule createdInModule, Object[] args) {
		preloadSections = new ArrayList<ListSectionProxy>();
		defaultValues.put(TiC.PROPERTY_DEFAULT_ITEM_TEMPLATE, UIModule.LIST_ITEM_TEMPLATE_DEFAULT);
		super.handleCreationArgs(createdInModule, args);
		
	}
	public void handleCreationDict(KrollDict options) {
		super.handleCreationDict(options);
		//Adding sections to preload sections, so we can handle appendSections/insertSection
		//accordingly if user call these before TiListView is instantiated.
		if (options.containsKey(TiC.PROPERTY_SECTIONS)) {
			Object obj = options.get(TiC.PROPERTY_SECTIONS);
			if (obj instanceof Object[]) {
				addPreloadSections((Object[]) obj, -1, true);
			}
		}
	}
	
	public void clearPreloadSections() {
		if (preloadSections != null) {
			preloadSections.clear();
		}
	}
	
	public ArrayList<ListSectionProxy> getPreloadSections() {
		return preloadSections;
	}
	
	public boolean isPreload() {
		return preload;
	}
	
	private void addPreloadSections(Object secs, int index, boolean arrayOnly) {
		if (secs instanceof Object[]) {
			Object[] sections = (Object[]) secs;
			for (int i = 0; i < sections.length; i++) {
				Object section = sections[i];
				addPreloadSection(section, -1);
			}
		} else if (!arrayOnly) {
			addPreloadSection(secs, -1);
		}
	}
	
	private void addPreloadSection(Object section, int index) {
		if (section instanceof ListSectionProxy) {
			if (index == -1) {
				preloadSections.add((ListSectionProxy) section);
			} else {
				preloadSections.add(index, (ListSectionProxy) section);
			}
		}
	}
	
	@Kroll.method @Kroll.getProperty
	public int getSectionCount() {
		if (TiApplication.isUIThread()) {
			return handleSectionCount();
		} else {
			return (Integer) TiMessenger.sendBlockingMainMessage(getMainHandler().obtainMessage(MSG_SECTION_COUNT));
		}
	}
	
	public int handleSectionCount () {
		TiUIView listView = peekView();
		if (listView != null) {
			return ((TiListView) listView).getSectionCount();
		}
		return 0;
	}

	@Kroll.method
	public void scrollToItem(int sectionIndex, int itemIndex) {
		if (TiApplication.isUIThread()) {
			handleScrollToItem(sectionIndex, itemIndex);
		} else {
			KrollDict d = new KrollDict();
			d.put("itemIndex", itemIndex);
			d.put("sectionIndex", sectionIndex);
			TiMessenger.sendBlockingMainMessage(getMainHandler().obtainMessage(MSG_SCROLL_TO_ITEM), d);
		}
	}
	

	@Override
	public boolean handleMessage(final Message msg) 	{

		switch (msg.what) {

			case MSG_SECTION_COUNT: {
				AsyncResult result = (AsyncResult)msg.obj;
				result.setResult(handleSectionCount());
				return true;
			}

			case MSG_SCROLL_TO_ITEM: {
				AsyncResult result = (AsyncResult)msg.obj;
				KrollDict data = (KrollDict) result.getArg();
				int sectionIndex = data.getInt("sectionIndex");
				int itemIndex = data.getInt("itemIndex");
				handleScrollToItem(sectionIndex, itemIndex);
				result.setResult(null);
				return true;
			}
			case MSG_APPEND_SECTION: {
				handleAppendSection(msg.obj);
				return true;
			}
			case MSG_DELETE_SECTION_AT: {
				handleDeleteSectionAt(TiConvert.toInt(msg.obj));
				return true;
			}
			case MSG_INSERT_SECTION_AT: {
				KrollDict data = (KrollDict) msg.obj;
				int index = data.getInt("index");
				Object section = data.get("section");
				handleInsertSectionAt(index, section);
				return true;
			}
			case MSG_REPLACE_SECTION_AT: {
				KrollDict data = (KrollDict) msg.obj;
				int index = data.getInt("index");
				Object section = data.get("section");
				handleReplaceSectionAt(index, section);
				return true;
			}
			default:
				return super.handleMessage(msg);
		}
	}
	private void handleScrollToItem(int sectionIndex, int itemIndex) {
		TiUIView listView = peekView();
		if (listView != null) {
			((TiListView) listView).scrollToItem(sectionIndex, itemIndex);
		}
	}
	
	@Kroll.method
	public void appendSection(Object section) {
		if (TiApplication.isUIThread()) {
			handleAppendSection(section);
		} else {
			Handler handler = getMainHandler();
			handler.sendMessage(handler.obtainMessage(MSG_APPEND_SECTION, section));
		}
	}

	private void handleAppendSection(Object section) {
		TiUIView listView = peekView();
		if (listView != null) {
			((TiListView) listView).appendSection(section);
		} else {
			preload = true;
			addPreloadSections(section, -1, false);
		}
	}
	
	@Kroll.method
	public void deleteSectionAt(int index) {
		if (TiApplication.isUIThread()) {
			handleDeleteSectionAt(index);
		} else {
			Handler handler = getMainHandler();
			handler.sendMessage(handler.obtainMessage(MSG_DELETE_SECTION_AT, index));
		}
	}
	
	private void handleDeleteSectionAt(int index) {
		TiUIView listView = peekView();
		if (listView != null) {
			((TiListView) listView).deleteSectionAt(index);
		} else {
			if (index < 0 || index >= preloadSections.size()) {
				Log.e(TAG, "Invalid index to delete section");
				return;
			}
			preload = true;
			preloadSections.remove(index);
		}
	}
	
	@Kroll.method
	public void insertSectionAt(int index, Object section) {
		if (TiApplication.isUIThread()) {
			handleInsertSectionAt(index, section);
		} else {
			sendInsertSectionMessage(index, section);
		}
	}
	
	private void sendInsertSectionMessage(int index, Object section) {
		Handler handler = getMainHandler();
		KrollDict data = new KrollDict();
		data.put("index", index);
		data.put("section", section);
		handler.sendMessage(handler.obtainMessage(MSG_INSERT_SECTION_AT, data));
	}
	
	private void handleInsertSectionAt(int index, Object section) {
		TiUIView listView = peekView();
		if (listView != null) {
			((TiListView) listView).insertSectionAt(index, section);
		} else {
			if (index < 0 || index > preloadSections.size()) {
				Log.e(TAG, "Invalid index to insertSection");
				return;
			}
			preload = true;
			addPreloadSections(section, index, false);
		}
	}
	
	@Kroll.method
	public void replaceSectionAt(int index, Object section) {
		if (TiApplication.isUIThread()) {
			handleReplaceSectionAt(index, section);
		} else {
			sendReplaceSectionMessage(index, section);
		}
	}
	
	private void sendReplaceSectionMessage(int index, Object section) {
		Handler handler = getMainHandler();
		KrollDict data = new KrollDict();
		data.put("index", index);
		data.put("section", section);
		handler.sendMessage(handler.obtainMessage(MSG_REPLACE_SECTION_AT, data));
	}

	private void handleReplaceSectionAt(int index, Object section) {
		TiUIView listView = peekView();
		if (listView != null) {
			((TiListView) listView).replaceSectionAt(index, section);
		} else {
			handleDeleteSectionAt(index);
			handleInsertSectionAt(index,  section);
			
		}
	}
}

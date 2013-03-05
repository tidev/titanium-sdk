package ti.modules.titanium.ui.widget.listview;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.AsyncResult;
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

	private static final int MSG_FIRST_ID = TiViewProxy.MSG_LAST_ID + 1;

	private static final int MSG_SCROLL_TO_ITEM = MSG_FIRST_ID + 400;
	private static final int MSG_APPEND_SECTION = MSG_FIRST_ID + 401;
	private static final int MSG_INSERT_SECTION_AT = MSG_FIRST_ID + 402;
	private static final int MSG_DELETE_SECTION_AT = MSG_FIRST_ID + 403;
	private static final int MSG_REPLACE_SECTION_AT = MSG_FIRST_ID + 404;


	private boolean preload = true;
	
	public TiUIView createView(Activity activity) {
		return new TiListView(this, activity);
	}
	
	
	@Kroll.method @Kroll.getProperty
	public int getSectionCount() {
		TiUIView listView = peekView();
		if (listView != null) {
			((TiListView) listView).getSectionCount();
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
			preload = false;
			((TiListView) listView).appendSection(section);
		} else if (preload) {
			//if listView is added into a HW window, we need to skip a cycle to wait for processProperties
			//before handling section methods.
			Handler handler = getMainHandler();
			handler.sendMessage(handler.obtainMessage(MSG_APPEND_SECTION, section));
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
			preload = false;
			((TiListView) listView).deleteSectionAt(index);
		} else if (preload) {
			Handler handler = getMainHandler();
			handler.sendMessage(handler.obtainMessage(MSG_DELETE_SECTION_AT, index));
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
			preload = false;
			((TiListView) listView).insertSectionAt(index, section);
		} else if (preload) {
			sendInsertSectionMessage(index, section);	
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
			preload = false;
			((TiListView) listView).replaceSectionAt(index, section);
		} else if (preload) {
			sendReplaceSectionMessage(index, section);	
		}
	}
}

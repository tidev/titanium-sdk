/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import java.util.ArrayList;
import java.util.HashMap;

import android.graphics.Color;
import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.view.TiUIView;
import org.appcelerator.titanium.util.TiColorHelper;

import ti.modules.titanium.ui.widget.TiUITableView;
import ti.modules.titanium.ui.widget.tableview.TableViewModel;
import ti.modules.titanium.ui.widget.tableview.TableViewModel.Item;
import ti.modules.titanium.ui.widget.tableview.TiTableViewRowProxyItem;
import android.app.Activity;
import android.os.Message;
// clang-format off
@Kroll.proxy(creatableInModule = UIModule.class,
	propertyAccessors = {
		TiC.PROPERTY_HAS_CHECK,
		TiC.PROPERTY_HAS_CHILD,
		TiC.PROPERTY_CLASS_NAME,
		TiC.PROPERTY_LAYOUT,
		TiC.PROPERTY_LEFT_IMAGE,
		TiC.PROPERTY_RIGHT_IMAGE,
		TiC.PROPERTY_TITLE,
		TiC.PROPERTY_HEADER,
		TiC.PROPERTY_FOOTER
})
// clang-format on
public class TableViewRowProxy extends TiViewProxy
{
	private static final String TAG = "TableViewRowProxy";

	protected ArrayList<TiViewProxy> controls;
	protected TiTableViewRowProxyItem tableViewItem;

	private static final int MSG_SET_DATA = TiViewProxy.MSG_LAST_ID + 5001;

	public TableViewRowProxy()
	{
		super();
		// TIMOB-24058: Prevent setOnClickListener() from being set allowing
		// backgroundSelectedColor and backgroundSelectedImage to function
		defaultValues.put(TiC.PROPERTY_TOUCH_ENABLED, false);
	}

	@Override
	public void setActivity(Activity activity)
	{
		super.setActivity(activity);
		if (controls != null) {
			for (TiViewProxy control : controls) {
				control.setActivity(activity);
			}
		}
	}

	@Override
	public void handleCreationDict(KrollDict options)
	{
		super.handleCreationDict(options);
		if (options.containsKey(TiC.PROPERTY_SELECTED_BACKGROUND_COLOR)) {
			Log.w(TAG, "selectedBackgroundColor is deprecated, use backgroundSelectedColor instead");
			setProperty(TiC.PROPERTY_BACKGROUND_SELECTED_COLOR, options.get(TiC.PROPERTY_SELECTED_BACKGROUND_COLOR));
		}
		if (options.containsKey(TiC.PROPERTY_SELECTED_BACKGROUND_IMAGE)) {
			Log.w(TAG, "selectedBackgroundImage is deprecated, use backgroundSelectedImage instead");
			setProperty(TiC.PROPERTY_BACKGROUND_SELECTED_IMAGE, options.get(TiC.PROPERTY_SELECTED_BACKGROUND_IMAGE));
		}
		if (!options.containsKey(TiC.PROPERTY_COLOR)) {
			if (options.containsKey(TiC.PROPERTY_BACKGROUND_COLOR)) {
				int color = TiColorHelper.parseColor((String) options.get(TiC.PROPERTY_BACKGROUND_COLOR));
				if (Math.abs(color - Color.WHITE) < Math.abs(color - Color.BLACK)) {
					options.put(TiC.PROPERTY_COLOR, "black");
				} else {
					options.put(TiC.PROPERTY_COLOR, "white");
				}
			} else {
				options.put(TiC.PROPERTY_COLOR, "white");
			}
		}
	}

	public void setCreationProperties(KrollDict options)
	{
		for (String key : options.keySet()) {
			setProperty(key, options.get(key));
		}
	}

	@Override
	public TiUIView createView(Activity activity)
	{
		return null;
	}

	public ArrayList<TiViewProxy> getControls()
	{
		return controls;
	}

	public boolean hasControls()
	{
		return (controls != null && controls.size() > 0);
	}

	@Override
	public TiViewProxy[] getChildren()
	{
		if (controls == null) {
			return new TiViewProxy[0];
		}
		return controls.toArray(new TiViewProxy[controls.size()]);
	}

	@Override
	public void add(Object args)
	{
		if (args == null) {
			Log.e(TAG, "Add called with a null child");
			return;
		}
		if (args instanceof Object[]) {
			for (Object arg : (Object[]) args) {
				if (arg instanceof TiViewProxy) {
					add((TiViewProxy) arg);
				} else {
					Log.w(TAG, "add() unsupported array object: " + arg.getClass().getSimpleName());
				}
			}
		} else if (args instanceof TiViewProxy) {
			if (controls == null) {
				controls = new ArrayList<TiViewProxy>();
			}
			TiViewProxy view = (TiViewProxy) args;
			controls.add(view);
			view.setParent(this);
			if (tableViewItem != null) {
				Message message = getMainHandler().obtainMessage(MSG_SET_DATA);
				// Message msg = getUIHandler().obtainMessage(MSG_SET_DATA);
				message.sendToTarget();
			}
		} else {
			Log.w(TAG, "add() unsupported argument type: " + args.getClass().getSimpleName());
		}
	}

	@Override
	public void remove(TiViewProxy control)
	{
		if (controls == null) {
			return;
		}
		controls.remove(control);
		if (tableViewItem != null) {
			Message message = getMainHandler().obtainMessage(MSG_SET_DATA);
			// Message msg = getUIHandler().obtainMessage(MSG_SET_DATA);
			message.sendToTarget();
		}
	}

	public void setTableViewItem(TiTableViewRowProxyItem item)
	{
		this.tableViewItem = item;
	}

	public TableViewProxy getTable()
	{
		TiViewProxy parent = getParent();
		while (!(parent instanceof TableViewProxy) && parent != null) {
			parent = parent.getParent();
		}
		return (TableViewProxy) parent;
	}

	@Override
	public void setProperty(String name, Object value)
	{
		super.setProperty(name, value);
		if (tableViewItem != null) {
			tableViewItem.setRowData(this);
		}
	}

	@Override
	public boolean handleMessage(Message msg)
	{
		if (msg.what == MSG_SET_DATA) {
			if (tableViewItem != null) {
				tableViewItem.setRowData(this);
				// update/refresh table view when a row's data changed.
				TableViewProxy proxy = getTable();
				if (proxy != null) {
					TiUITableView table = (TiUITableView) proxy.peekView();
					if (table != null) {
						table.setModelDirty();
						table.updateView();
					}
				}
			}
			return true;
		}
		return super.handleMessage(msg);
	}

	public static void fillClickEvent(HashMap<String, Object> data, TableViewModel model, Item item)
	{
		// Don't include rowData if we click on a section
		if (!(item.proxy instanceof TableViewSectionProxy)) {
			data.put(TiC.PROPERTY_ROW_DATA, item.rowData);
		}

		data.put(TiC.PROPERTY_SECTION, model.getSection(item.sectionIndex));
		data.put(TiC.EVENT_PROPERTY_ROW, item.proxy);
		data.put(TiC.EVENT_PROPERTY_INDEX, item.index);
		data.put(TiC.EVENT_PROPERTY_DETAIL, false);
	}

	@Override
	public boolean fireEvent(String eventName, Object data, boolean bubbles)
	{
		// Inject row click data for events coming from row children.
		TableViewProxy table = getTable();
		if (tableViewItem != null) {
			Item item = tableViewItem.getRowData();
			if (table != null && item != null && data instanceof HashMap) {
				// The data object may already be in use by the runtime thread
				// due to a child view's event fire. Create a copy to be thread safe.
				@SuppressWarnings("unchecked")
				KrollDict dataCopy = new KrollDict((HashMap<String, Object>) data);
				fillClickEvent(dataCopy, table.getTableView().getModel(), item);
				data = dataCopy;
			}
		}

		return super.fireEvent(eventName, data, bubbles);
	}

	@Override
	public void firePropertyChanged(String name, Object oldValue, Object newValue)
	{
		super.firePropertyChanged(name, oldValue, newValue);
		TableViewProxy table = getTable();
		if (table != null) {
			table.updateView();
		}
	}

	public void setLabelsClickable(boolean clickable)
	{
		if (controls != null) {
			for (TiViewProxy control : controls) {
				if (control instanceof LabelProxy) {
					((LabelProxy) control).setClickable(clickable);
				}
			}
		}
	}

	@Override
	public void releaseViews()
	{
		if (tableViewItem != null) {
			tableViewItem.release();
			tableViewItem = null;
		}
		if (controls != null) {
			for (TiViewProxy control : controls) {
				control.releaseViews();
			}
		}

		super.releaseViews();
	}

	@Override
	public void release()
	{
		releaseViews();

		if (controls != null) {
			for (TiViewProxy control : controls) {
				control.release();
			}
			controls.clear();
			controls = null;
		}

		super.release();
	}

	public TiTableViewRowProxyItem getTableViewRowProxyItem()
	{
		return tableViewItem;
	}

	@Override
	public String getApiName()
	{
		return "Ti.UI.TableViewRow";
	}
}

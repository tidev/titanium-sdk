/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package ti.modules.titanium.ui.widget.listview;

import java.lang.ref.WeakReference;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.AsyncResult;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.kroll.common.TiMessenger;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiCompositeLayout;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.UIModule;
import ti.modules.titanium.ui.ViewProxy;
import ti.modules.titanium.ui.widget.listview.TiListView.TiBaseAdapter;
import ti.modules.titanium.ui.widget.listview.TiTemplate.DataItem;
import android.os.Message;
import android.view.View;

@Kroll.proxy(creatableInModule = UIModule.class, propertyAccessors = {
})
public class ListSectionProxy extends ViewProxy{

	private static final String TAG = "SectionProxy";
	private ArrayList<ListItemData> listItemData;
	private int itemCount;
	private TiBaseAdapter adapter;
	private ArrayList<Object> itemProperties;
	private boolean preload;
	
	private String headerTitle;
	private String footerTitle;
	
	private WeakReference<TiListView> listView;
	public DefaultTemplate builtInTemplate;
	
	private static final int MSG_FIRST_ID = TiViewProxy.MSG_LAST_ID + 1;

	private static final int MSG_SET_ITEMS = MSG_FIRST_ID + 700;
	private static final int MSG_APPEND_ITEMS = MSG_FIRST_ID + 701;
	private static final int MSG_INSERT_ITEMS_AT = MSG_FIRST_ID + 702;
	private static final int MSG_DELETE_ITEMS_AT = MSG_FIRST_ID + 703;
	private static final int MSG_GET_ITEM_AT = MSG_FIRST_ID + 704;
	private static final int MSG_REPLACE_ITEMS_AT = MSG_FIRST_ID + 705;

	
	public class ListItemData {
		private KrollDict properties;
		private TiTemplate template;
		public ListItemData (KrollDict properties, TiTemplate template) {
			this.properties = properties;
			this.template = template;
		}
		
		public KrollDict getProperties() {
			return properties;
		}
		
		public TiTemplate getTemplate() {
			return template;
		}
	}
	
	public ListSectionProxy () {
		//initialize variables
		listItemData = new ArrayList<ListItemData>();
		itemCount = 0;
		preload = false;
	}
	
	public void handleCreationDict(KrollDict dict) {
		//getting header/footer titles from creation dictionary
		if (dict.containsKey(TiC.PROPERTY_HEADER_TITLE)) {
			headerTitle = TiConvert.toString(dict, TiC.PROPERTY_HEADER_TITLE);
		}
		if (dict.containsKey(TiC.PROPERTY_FOOTER_TITLE)) {
			footerTitle = TiConvert.toString(dict, TiC.PROPERTY_FOOTER_TITLE);
		}
	}
	
	public void setAdapter(TiBaseAdapter a) {
		adapter = a;
	}

	@Kroll.method @Kroll.setProperty
	public void setHeaderTitle(String headerTitle) {
		this.headerTitle = headerTitle;
		if (adapter != null) {
			adapter.notifyDataSetChanged();
		}
	}
	
	@Kroll.method @Kroll.getProperty
	public String getHeaderTitle() {
		return headerTitle;
	}
	
	@Kroll.method @Kroll.setProperty
	public void setFooterTitle(String headerTitle) {
		this.footerTitle = headerTitle;
		if (adapter != null) {
			adapter.notifyDataSetChanged();
		}
	}
	
	@Kroll.method @Kroll.getProperty
	public String getFooterTitle() {
		return footerTitle;
	}
	
	public String getHeaderOrFooterTitle(int index) {
		if (isHeaderView(index)) {
			return headerTitle;
		} else if (isFooterView(index)) {
			return footerTitle;
		} else return "";
	}

	@Override
	public boolean handleMessage(Message msg) 
	{
		switch (msg.what) {

		case MSG_SET_ITEMS: {
			AsyncResult result = (AsyncResult) msg.obj;
			handleSetItems(result.getArg());
			result.setResult(null);
			return true;
		}
		
		case MSG_APPEND_ITEMS: {
			AsyncResult result = (AsyncResult) msg.obj;
			handleAppendItems(result.getArg());
			result.setResult(null);
			return true;
		}
		
		case MSG_INSERT_ITEMS_AT: {
			AsyncResult result = (AsyncResult) msg.obj;
			KrollDict data = (KrollDict) result.getArg();
			int index = data.getInt("index");
			handleInsertItemsAt(index, data.get("data"));
			result.setResult(null);
			return true;
		}
		
		case MSG_DELETE_ITEMS_AT: {
			AsyncResult result = (AsyncResult) msg.obj;
			KrollDict data = (KrollDict) result.getArg();
			int index = data.getInt("index");
			int count = data.getInt("count");
			handleDeleteItemsAt(index, count);
			result.setResult(null);
			return true;
		}
		
		case MSG_REPLACE_ITEMS_AT: {
			AsyncResult result = (AsyncResult) msg.obj;
			KrollDict data = (KrollDict) result.getArg();
			int index = data.getInt("index");
			int count = data.getInt("count");
			handleReplaceItemsAt(index, count, data.get("data"));
			result.setResult(null);
			return true;
		}
		
		case MSG_GET_ITEM_AT: {
			AsyncResult result = (AsyncResult) msg.obj;
			KrollDict item = handleGetItemAt(TiConvert.toInt(result.getArg()));
			result.setResult(item);
			return true;
		}

		default : {
			return super.handleMessage(msg);
		}

		}
	}
	
	@Kroll.method
	public KrollDict getItemAt(int index) {
		if (TiApplication.isUIThread()) {
			return handleGetItemAt(index);
		} else {
			return (KrollDict) TiMessenger.sendBlockingMainMessage(getMainHandler().obtainMessage(MSG_GET_ITEM_AT), index);
		}
	}
	
	private KrollDict handleGetItemAt(int index) {
		if (itemProperties != null && index >= 0 && index < itemProperties.size()) {
			return new KrollDict((HashMap)itemProperties.get(index));
		}
		return null;
	}

	@Kroll.method
	public void setItems(Object data) {
		if (TiApplication.isUIThread()) {
			handleSetItems(data);
		} else {
			TiMessenger.sendBlockingMainMessage(getMainHandler().obtainMessage(MSG_SET_ITEMS), data);
		}
		
	}
	
	@Kroll.method
	public void appendItems(Object data) {
		if (TiApplication.isUIThread()) {
			handleAppendItems(data);
		} else {
			TiMessenger.sendBlockingMainMessage(getMainHandler().obtainMessage(MSG_APPEND_ITEMS), data);
		}
	}
	
	@Kroll.method
	public void insertItemsAt(int index, Object data) {
		if (TiApplication.isUIThread()) {
			handleInsertItemsAt(index, data);
		} else {
			KrollDict d = new KrollDict();
			d.put("data", data);
			d.put("index", index);
			TiMessenger.sendBlockingMainMessage(getMainHandler().obtainMessage(MSG_INSERT_ITEMS_AT), d);
		}
	}
	
	@Kroll.method
	public void deleteItemsAt(int index, int count) {
		if (TiApplication.isUIThread()) {
			handleDeleteItemsAt(index, count);
		} else {
			KrollDict d = new KrollDict();
			d.put("index", index);
			d.put("count", count);
			TiMessenger.sendBlockingMainMessage(getMainHandler().obtainMessage(MSG_DELETE_ITEMS_AT), d);
		}
	}
	
	@Kroll.method
	public void replaceItemsAt(int index, int count, Object data) {
		if (TiApplication.isUIThread()) {
			handleReplaceItemsAt(index, count, data);
		} else {
			KrollDict d = new KrollDict();
			d.put("index", index);
			d.put("count", count);
			d.put("data", data);
			TiMessenger.sendBlockingMainMessage(getMainHandler().obtainMessage(MSG_REPLACE_ITEMS_AT), d);
		}
	}
	
	public void processPreloadData() {
		if (itemProperties != null && preload) {
			handleSetItems(itemProperties.toArray());
			preload = false;
		}
	}

	private void processData(Object[] views, int offset) {
		
		TiTemplate[] temps = new TiTemplate[views.length];
		//First pass through data, we process template and update
		//default properties based data given
		for (int i = 0; i < views.length; i++) {
			Object itemData = views[i];
			if (itemData instanceof HashMap) {
				KrollDict d = new KrollDict((HashMap)itemData);
				TiTemplate template = processTemplate(d, i + offset);
				template.updateOrMergeWithDefaultProperties(d, true);
				temps[i] = template;
			}
		}
		//Second pass we would merge properties
		for (int i = 0; i < views.length; i++) {
			Object itemData = views[i];
			if (itemData instanceof HashMap) {
				KrollDict d = new KrollDict((HashMap)itemData);
				TiTemplate template = temps[i];
				if (template != null) {
					template.updateOrMergeWithDefaultProperties(d, false);
				}
				ListItemData itemD = new ListItemData(d, template);
				d.remove(TiC.PROPERTY_TEMPLATE);
				listItemData.add(i+offset, itemD);
			}
		}
		//Notify adapter that data has changed.
		adapter.notifyDataSetChanged();
	}

	private void handleSetItems(Object data) {

		if (data instanceof Object[]) {
			Object[] views = (Object[]) data;
			itemProperties =  new ArrayList<Object>(Arrays.asList(views));
			listItemData.clear();
			//only process items when listview's properties is processed.
			if (getListView() == null) {
				preload = true;
				return;
			}
			itemCount = views.length;
			processData(views, 0);

		} else {
			Log.e(TAG, "Invalid argument type to setData");
		}
	}
	
	private void handleAppendItems(Object data) {
		if (data instanceof Object[]) {
			Object[] views = (Object[]) data;
			if (itemProperties == null) {
				itemProperties = new ArrayList<Object>(Arrays.asList(views));
			} else {
				for (Object view: views) {
					itemProperties.add(view);
				}
			}
			//only process items when listview's properties is processed.
			if (getListView() == null) {
				preload = true;
				return;
			}
			processData(views, itemCount);
			itemCount += views.length;
			
		} else {
			Log.e(TAG, "Invalid argument type to setData");
		}
	}
	
	private void handleInsertItemsAt(int index, Object data) {
		if (data instanceof Object[]) {
			Object[] views = (Object[]) data;
			
			if (itemProperties == null) {
				itemProperties = new ArrayList<Object>(Arrays.asList(views));
			} else {
				if (index < 0 || index > itemProperties.size()) {
					Log.e(TAG, "Invalid index to handleInsertItem");
					return;
				}
				int counter = index;
				for (Object view: views) {
					itemProperties.add(counter, view);
					counter++;
				}
			}
			//only process items when listview's properties is processed.
			if (getListView() == null) {
				preload = true;
				return;
			}
			processData(views, index);
			itemCount += views.length;		
		} else {
			Log.e(TAG, "Invalid argument type to insertItemsAt");
		}
	}
	
	private void deleteItems(int index, int count) {
		while (count > 0) {
			if (index < itemProperties.size()) {
				itemProperties.remove(index);
				itemCount--;
			}
			if (index < listItemData.size()) {
				listItemData.remove(index);
			}
			count--;
		}
	}
	
	private void handleDeleteItemsAt(int index, int count) {
		deleteItems(index, count);
		if (adapter != null) {
			adapter.notifyDataSetChanged();
		}
	}
	
	private void handleReplaceItemsAt(int index, int count, Object data) {
		deleteItems(index, count);
		handleInsertItemsAt(index, data);
	}
	
	private TiTemplate processTemplate(KrollDict itemData, int index) {
		
		TiListView listView = getListView();
		String defaultTemplateBinding = null;
		if (listView != null) {
			defaultTemplateBinding = listView.getDefaultTemplateBinding();
		}
		//if template is specified in data, we look it up and if one exists, we use it.
		//Otherwise we check if a default template is specified in ListView. If not, we use builtInTemplate.
		String binding = TiConvert.toString(itemData.get(TiC.PROPERTY_TEMPLATE));
		if (binding != null) {
			//check if template is default
			if (binding.equals(UIModule.LIST_ITEM_TEMPLATE_DEFAULT)) {
				return processDefaultTemplate(itemData, index);
			}

			TiTemplate template = listView.getTemplateByBinding(binding);
			//if template is successfully retrieved, bind it to the index. This is b/c
			//each row can have a different template.
			if (template == null) {
				Log.e(TAG, "Template undefined");
			}
						
			return template;
			
		} else {
			//if a valid default template is specify, use that one
			if (defaultTemplateBinding != null && !defaultTemplateBinding.equals(UIModule.LIST_ITEM_TEMPLATE_DEFAULT)) {
				TiTemplate defTemplate = listView.getTemplateByBinding(defaultTemplateBinding);
				if (defTemplate != null) {
					return defTemplate;
				}
			}
			return processDefaultTemplate(itemData, index);
		}	
		
	}
	
	private TiTemplate processDefaultTemplate(KrollDict data, int index) {

		if (builtInTemplate == null){
		
			//Create template and generate default properties
			builtInTemplate = new DefaultTemplate(UIModule.LIST_ITEM_TEMPLATE_DEFAULT, null, getActivity());
			//Each template is treated as an item type, so we can reuse views efficiently.
			//Section templates are given a type in TiListView.processSections(). Here we
			//give default template a type if possible.
			TiListView listView = getListView();
			if (listView != null) {
				builtInTemplate.setType(TiListView.BUILT_IN_TEMPLATE_ITEM_TYPE);
				builtInTemplate.setRootParent(listView.getProxy());
			}
		}

		return builtInTemplate;
	}

	/**
	 * This method creates a new cell and fill it with content. getView() calls this method
	 * when a view needs to be created.
	 * @param index Entry's index relative to its section
	 * @return
	 */
	public void generateCellContent(int index, KrollDict data, TiTemplate template, TiBaseListViewItem itemContent, int itemPosition, View item_layout) {
		//Here we create an item content and populate it with data
		//Get item proxy
		TiViewProxy itemProxy = template.getRootItem().getViewProxy();
		//Create corresponding TiUIView for item proxy
		TiListItem item = new TiListItem(itemProxy, (TiCompositeLayout.LayoutParams)itemContent.getLayoutParams(), itemContent, item_layout);		
		//Connect native view with TiUIView so we can get it from recycled view.
		itemContent.setTag(item);
	
		if (data != null && template != null) {
			generateChildContentViews(template.getRootItem(), null, itemContent, true);
			populateViews(data, itemContent, template, itemPosition, index, item_layout);
		}
	}
	
	
	public void generateChildContentViews(DataItem item, TiUIView parentContent, TiBaseListViewItem rootItem, boolean root) {

		ArrayList<DataItem> childrenItem = item.getChildren();
		for (int i = 0; i < childrenItem.size(); i++) {
			DataItem child = childrenItem.get(i);
			TiViewProxy proxy = child.getViewProxy();
			TiUIView view = proxy.createView(proxy.getActivity());
			generateChildContentViews(child, view, rootItem, false);
			//Bind view to root.
			ViewItem viewItem = new ViewItem(view, new KrollDict());
			rootItem.bindView(child.getBindingId(), viewItem);
			//Add it to view hierarchy
			if (root) {
				rootItem.addView(view.getNativeView(), view.getLayoutParams());
			} else {
				parentContent.add(view);
			}

		}
	}
	
	public void appendExtraEventData(TiUIView view, int itemPosition, int sectionIndex, String bindId) {
		KrollDict existingData = view.getAdditionalEventData();
		if (existingData == null) {
			existingData = new KrollDict();
			view.setAdditionalEventData(existingData);
		}

		if (headerTitle != null) {
			itemPosition -= 1;
			sectionIndex -= 1;
		}
		
		existingData.put(TiC.PROPERTY_SECTION, this);
		existingData.put(TiC.PROPERTY_SECTION_INDEX, sectionIndex);
		existingData.put(TiC.PROPERTY_BIND_ID, bindId);
		existingData.put(TiC.PROPERTY_ITEM_INDEX, itemPosition);
	}
	
	public void populateViews(KrollDict data, TiBaseListViewItem cellContent, TiTemplate template, int itemPosition, int sectionIndex, View item_layout) {
		Object cell = cellContent.getTag();
		
		HashMap<String, ViewItem> views = (HashMap<String, ViewItem>) cellContent.getViewsMap();
		//Loop through all our views and apply default properties
		for (String binding: views.keySet()) {
			DataItem dataItem = template.getDataItem(binding);
			ViewItem viewItem = views.get(binding);
			TiUIView view = viewItem.getView();
			if (view != null) {
				appendExtraEventData(view, itemPosition, sectionIndex, binding);
			}
			//if binding is contain in data given to us, process that data, otherwise
			//apply default properties.
			if (data.containsKey(binding) && view != null) {
				KrollDict properties = new KrollDict((HashMap)data.get(binding));
				KrollDict diffProperties = viewItem.generateDiffProperties(properties);
				if (!diffProperties.isEmpty()) {
					view.processProperties(diffProperties);
				}

			} else if (dataItem != null && view != null) {
				KrollDict diffProperties = viewItem.generateDiffProperties(dataItem.getDefaultProperties());
				if (!diffProperties.isEmpty()) {
					view.processProperties(diffProperties);
				}
			} else {
				Log.w(TAG, "Sorry, " + binding + " isn't a valid binding. Perhaps you made a typo?");
			}
			
		}
		
		//Handling root item, since that is not in the views map.
		if (!(cell instanceof TiListItem)) {
			Log.e(TAG, "Cell is not TiListItem. Something is wrong..");
			return;
		}

		TiListItem listItem = (TiListItem) cell;
		appendExtraEventData(listItem, itemPosition, sectionIndex, TiC.PROPERTY_PROPERTIES);
		if (data.containsKey(TiC.PROPERTY_PROPERTIES)) {
			KrollDict properties = new KrollDict((HashMap)data.get(TiC.PROPERTY_PROPERTIES));
			KrollDict diffProperties = cellContent.getViewItem().generateDiffProperties(properties);
			if (!diffProperties.isEmpty()) {
				listItem.processProperties(properties);
			}
		} else {
			KrollDict diffProperties = cellContent.getViewItem().generateDiffProperties(template.getRootItem().getDefaultProperties());
			if (!diffProperties.isEmpty()) {
				listItem.processProperties(diffProperties);
			}
		}
	}
	
	public TiTemplate getTemplateByIndex(int index) {
		if (headerTitle != null) {
			index -= 1;
		}
		return listItemData.get(index).getTemplate();
	}

	public int getContentCount() {
		return itemCount;
	}
	/**
	 * @return number of entries within section
	 */
	public int getItemCount() {
		int totalCount = itemCount;
		if (headerTitle != null) {
			totalCount += 1;
		}
		if (footerTitle != null) {
			totalCount +=1;
		}
		return totalCount;
	}
	
	public boolean isHeaderView(int pos) {
		if (headerTitle != null && pos == 0) 
			return true;
		return false;
	}
	
	public boolean isFooterView(int pos) {
		if (footerTitle != null && pos == getItemCount() - 1) 
			return true;
		return false;
	}
	
	public void setListView(TiListView l) {
		listView = new WeakReference<TiListView>(l);
	}
	
	public TiListView getListView() {
		if (listView != null) {
			return listView.get();
		}
		return null;
	}
	
	/**
	 * Attempt to give each existing template a type, if possible
	 */
	public void setTemplateType() {
		
		for (int i = 0; i < listItemData.size(); i++) {
			TiTemplate temp = listItemData.get(i).getTemplate();
			TiListView listView = getListView();
			if (temp.getType() == -1) {
				temp.setType(listView.getItemType());
			}
		}
	}
	
	public KrollDict getListItemData(int position) {
		if (headerTitle != null) {
			position -= 1;
		}
		if (position >= 0 && position < listItemData.size()) {
			return listItemData.get(position).getProperties();
		} 
		return null;
	}
	
	public void release() {
		if (listItemData != null) {
			listItemData.clear();
		}
		
		if (itemProperties != null) {
			itemProperties.clear();
		}
		
		if (builtInTemplate != null) {
			builtInTemplate.release();
			builtInTemplate = null;
		}
		super.release();
	}
	
}

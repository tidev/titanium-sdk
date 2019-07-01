/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package ti.modules.titanium.ui.widget.listview;

import java.lang.ref.WeakReference;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiCompositeLayout;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.UIModule;
import ti.modules.titanium.ui.ViewProxy;
import ti.modules.titanium.ui.widget.listview.TiListView.TiBaseAdapter;
import ti.modules.titanium.ui.widget.listview.TiListViewTemplate.DataItem;
import android.app.Activity;
import android.view.View;

@Kroll.proxy(creatableInModule = UIModule.class, propertyAccessors = {})
public class ListSectionProxy extends ViewProxy
{

	private static final String TAG = "ListSectionProxy";
	private ArrayList<ListItemData> listItemData;
	private int itemCount;
	private TiBaseAdapter adapter;
	private ArrayList<Object> itemProperties;
	private ArrayList<Integer> filterIndices;
	private boolean preload;

	private String headerTitle;
	private String footerTitle;

	private TiViewProxy headerView;
	private TiViewProxy footerView;

	private WeakReference<TiListView> listView;
	public TiDefaultListViewTemplate builtInTemplate;

	public class ListItemData
	{
		private KrollDict properties;
		private TiListViewTemplate template;
		private String searchableText = "";
		public ListItemData(KrollDict properties, TiListViewTemplate template)
		{
			this.properties = properties;
			this.template = template;
			//set searchableText
			if (properties.containsKey(TiC.PROPERTY_PROPERTIES)) {
				Object props = properties.get(TiC.PROPERTY_PROPERTIES);
				if (props instanceof HashMap) {
					HashMap<String, Object> propsHash = (HashMap<String, Object>) props;
					Object searchText = propsHash.get(TiC.PROPERTY_SEARCHABLE_TEXT);
					if (propsHash.containsKey(TiC.PROPERTY_SEARCHABLE_TEXT) && searchText != null) {
						searchableText = TiConvert.toString(searchText);
					}
				}
			}
		}

		public KrollDict getProperties()
		{
			return properties;
		}

		public String getSearchableText()
		{
			return searchableText;
		}

		public TiListViewTemplate getTemplate()
		{
			return template;
		}
	}

	public ListSectionProxy()
	{
		//initialize variables
		listItemData = new ArrayList<ListItemData>();
		filterIndices = new ArrayList<Integer>();
		itemCount = 0;
		preload = false;
	}

	public void handleCreationDict(KrollDict dict)
	{
		//getting header/footer titles from creation dictionary
		if (dict.containsKey(TiC.PROPERTY_HEADER_TITLE)) {
			headerTitle = TiConvert.toString(dict, TiC.PROPERTY_HEADER_TITLE);
		}
		if (dict.containsKey(TiC.PROPERTY_FOOTER_TITLE)) {
			footerTitle = TiConvert.toString(dict, TiC.PROPERTY_FOOTER_TITLE);
		}
		if (dict.containsKey(TiC.PROPERTY_HEADER_VIEW)) {
			Object obj = dict.get(TiC.PROPERTY_HEADER_VIEW);
			if (obj instanceof TiViewProxy) {
				headerView = (TiViewProxy) obj;
			}
		}
		if (dict.containsKey(TiC.PROPERTY_FOOTER_VIEW)) {
			Object obj = dict.get(TiC.PROPERTY_FOOTER_VIEW);
			if (obj instanceof TiViewProxy) {
				footerView = (TiViewProxy) obj;
			}
		}
		if (dict.containsKey(TiC.PROPERTY_ITEMS)) {
			handleSetItems(dict.get(TiC.PROPERTY_ITEMS));
		}
	}

	public void setAdapter(TiBaseAdapter a)
	{
		adapter = a;
	}

	// clang-format off
	@Kroll.method
	@Kroll.setProperty
	public void setHeaderView(TiViewProxy headerView)
	// clang-format on
	{
		this.headerView = headerView;
		if (adapter != null) {
			adapter.notifyDataSetChanged();
		}
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public TiViewProxy getHeaderView()
	// clang-format on
	{
		return headerView;
	}

	// clang-format off
	@Kroll.method
	@Kroll.setProperty
	public void setFooterView(TiViewProxy footerView)
	// clang-format on
	{
		handleSetFooterView(footerView);
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public TiViewProxy getFooterView()
	// clang-format on
	{
		return footerView;
	}

	// clang-format off
	@Kroll.method
	@Kroll.setProperty
	public void setHeaderTitle(String headerTitle)
	// clang-format on
	{
		handleSetHeaderTitle(headerTitle);
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public String getHeaderTitle()
	// clang-format on
	{
		return headerTitle;
	}

	// clang-format off
	@Kroll.method
	@Kroll.setProperty
	public void setFooterTitle(String footerTitle)
	// clang-format on
	{
		handleSetFooterTitle(footerTitle);
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public String getFooterTitle()
	// clang-format on
	{
		return footerTitle;
	}

	public String getHeaderOrFooterTitle(int index)
	{
		if (isHeaderTitle(index)) {
			return headerTitle;
		} else if (isFooterTitle(index)) {
			return footerTitle;
		}
		return "";
	}

	public View getHeaderOrFooterView(int index)
	{
		if (isHeaderView(index)) {
			return getListView().layoutHeaderOrFooterView(headerView);
		} else if (isFooterView(index)) {
			return getListView().layoutHeaderOrFooterView(footerView);
		}
		return null;
	}

	@Kroll.method
	public KrollDict getItemAt(int index)
	{
		if (itemProperties != null && index >= 0 && index < itemProperties.size()) {
			return new KrollDict((HashMap) itemProperties.get(index));
		}
		return null;
	}

	// clang-format off
	@Kroll.method
	@Kroll.setProperty
	public void setItems(Object data)
	// clang-format on
	{
		handleSetItems(data);
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public Object[] getItems()
	// clang-format on
	{
		if (itemProperties == null) {
			return new Object[0];
		}
		return itemProperties.toArray();
	}

	@Kroll.method
	public void appendItems(Object data)
	{
		if (data instanceof Object[]) {
			Object[] views = (Object[]) data;
			if (itemProperties == null) {
				itemProperties = new ArrayList<Object>(Arrays.asList(views));
			} else {
				for (Object view : views) {
					itemProperties.add(view);
				}
			}
			//only process items when listview's properties is processed.
			if (getListView() == null) {
				preload = true;
				return;
			}
			//we must update the itemCount before notify data change. If we don't, it will crash
			int count = itemCount;
			itemCount += views.length;

			processData(views, count);

		} else {
			Log.e(TAG, "Invalid argument type to setData", Log.DEBUG_MODE);
		}
	}

	public boolean isIndexValid(int index)
	{
		return (index >= 0) ? true : false;
	}

	@Kroll.method
	public void insertItemsAt(int index, Object data)
	{
		if (!isIndexValid(index)) {
			return;
		}
		handleInsertItemsAt(index, data);
	}

	@Kroll.method
	public void deleteItemsAt(int index, int count)
	{
		if (!isIndexValid(index)) {
			return;
		}
		deleteItems(index, count);
		if (adapter != null) {
			adapter.notifyDataSetChanged();
		}
	}

	@Kroll.method
	public void replaceItemsAt(int index, int count, Object data)
	{
		if (!isIndexValid(index)) {
			return;
		}
		handleReplaceItemsAt(index, count, data);
	}

	@Kroll.method
	public void updateItemAt(int index, Object data)
	{
		if (!isIndexValid(index) || !(data instanceof HashMap)) {
			return;
		}
		handleReplaceItemsAt(index, 1, new Object[] { data });
		setProperty(TiC.PROPERTY_ITEMS, itemProperties.toArray());
	}

	public void processPreloadData()
	{
		if (itemProperties != null && preload) {
			handleSetItems(itemProperties.toArray());
			preload = false;
		}
	}

	public void refreshItems()
	{
		handleSetItems(itemProperties.toArray());
	}

	private void processData(Object[] items, int offset)
	{
		if (listItemData == null) {
			return;
		}

		TiListViewTemplate[] temps = new TiListViewTemplate[items.length];
		//First pass through data, we process template and update
		//default properties based data given
		for (int i = 0; i < items.length; i++) {
			Object itemData = items[i];
			if (itemData instanceof HashMap) {
				KrollDict d = new KrollDict((HashMap) itemData);
				TiListViewTemplate template = processTemplate(d, i + offset);
				template.updateOrMergeWithDefaultProperties(d, true);
				temps[i] = template;
			}
		}
		//Second pass we would merge properties
		for (int i = 0; i < items.length; i++) {
			Object itemData = items[i];
			if (itemData instanceof HashMap) {
				KrollDict d = new KrollDict((HashMap) itemData);
				TiListViewTemplate template = temps[i];
				if (template != null) {
					template.updateOrMergeWithDefaultProperties(d, false);
				}
				ListItemData itemD = new ListItemData(d, template);
				d.remove(TiC.PROPERTY_TEMPLATE);
				listItemData.add(i + offset, itemD);
			}
		}

		//reapply filter if necessary
		if (isFilterOn()) {
			applyFilter(getListView().getSearchText());
		}
		//Notify adapter that data has changed.
		adapter.notifyDataSetChanged();
	}

	private void handleSetItems(Object data)
	{

		if (data instanceof Object[]) {
			Object[] items = (Object[]) data;
			itemProperties = new ArrayList<Object>(Arrays.asList(items));
			listItemData.clear();
			//only process items when listview's properties is processed.
			if (getListView() == null) {
				preload = true;
				return;
			}
			itemCount = items.length;
			processData(items, 0);

		} else {
			Log.e(TAG, "Invalid argument type to setData", Log.DEBUG_MODE);
		}
	}

	private void handleSetHeaderTitle(String headerTitle)
	{
		this.headerTitle = headerTitle;
		if (adapter != null) {
			adapter.notifyDataSetChanged();
		}
	}

	private void handleSetFooterTitle(String footerTitle)
	{
		this.footerTitle = footerTitle;
		if (adapter != null) {
			adapter.notifyDataSetChanged();
		}
	}

	private void handleSetFooterView(TiViewProxy footerView)
	{
		this.footerView = footerView;
		if (adapter != null) {
			adapter.notifyDataSetChanged();
		}
	}

	private void handleInsertItemsAt(int index, Object data)
	{
		if (data instanceof Object[]) {
			Object[] views = (Object[]) data;

			if (itemProperties == null) {
				itemProperties = new ArrayList<Object>(Arrays.asList(views));
			} else {
				if (index < 0 || index > itemProperties.size()) {
					Log.e(TAG, "Invalid index to handleInsertItem", Log.DEBUG_MODE);
					return;
				}
				int counter = index;
				for (Object view : views) {
					itemProperties.add(counter, view);
					counter++;
				}
			}
			//only process items when listview's properties is processed.
			if (getListView() == null) {
				preload = true;
				return;
			}

			itemCount += views.length;
			processData(views, index);
		} else {
			Log.e(TAG, "Invalid argument type to insertItemsAt", Log.DEBUG_MODE);
		}
	}

	private boolean deleteItems(int index, int count)
	{
		boolean delete = false;
		while (count > 0) {
			if (index < itemProperties.size()) {
				itemProperties.remove(index);
				itemCount--;
				delete = true;
			}
			if (index < listItemData.size()) {
				listItemData.remove(index);
			}
			count--;
		}
		//reapply filter if necessary
		if (isFilterOn()) {
			applyFilter(getListView().getSearchText());
		}
		return delete;
	}

	private void handleReplaceItemsAt(int index, int count, Object data)
	{
		if (count == 0) {
			handleInsertItemsAt(index, data);
		} else if (deleteItems(index, count)) {
			handleInsertItemsAt(index, data);
		}
	}

	private TiListViewTemplate processTemplate(KrollDict itemData, int index)
	{

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

			TiListViewTemplate template = listView.getTemplateByBinding(binding);
			//if template is successfully retrieved, bind it to the index. This is b/c
			//each row can have a different template.
			if (template == null) {
				Log.e(TAG, "Template undefined");
			}

			return template;

		} else {
			//if a valid default template is specify, use that one
			if (defaultTemplateBinding != null && !defaultTemplateBinding.equals(UIModule.LIST_ITEM_TEMPLATE_DEFAULT)) {
				TiListViewTemplate defTemplate = listView.getTemplateByBinding(defaultTemplateBinding);
				if (defTemplate != null) {
					return defTemplate;
				}
			}
			return processDefaultTemplate(itemData, index);
		}
	}

	private TiListViewTemplate processDefaultTemplate(KrollDict data, int index)
	{

		if (builtInTemplate == null) {

			//Create template and generate default properties
			builtInTemplate = new TiDefaultListViewTemplate(UIModule.LIST_ITEM_TEMPLATE_DEFAULT, null, getActivity());
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
	public void generateCellContent(int sectionIndex, KrollDict data, TiListViewTemplate template,
									TiBaseListViewItem itemContent, int itemPosition, View item_layout)
	{
		//Here we create an item content and populate it with data
		//Get item proxy
		TiViewProxy itemProxy = template.getRootItem().getViewProxy();
		//Create corresponding TiUIView for item proxy
		TiListItem item = new TiListItem(itemProxy, (TiCompositeLayout.LayoutParams) itemContent.getLayoutParams(),
										 itemContent, item_layout);
		//Connect native view with TiUIView so we can get it from recycled view.
		itemContent.setTag(item);

		if (data != null && template != null) {
			generateChildContentViews(template.getRootItem(), null, itemContent, true);
			populateViews(data, itemContent, template, itemPosition, sectionIndex, item_layout);
		}
	}

	public void generateChildContentViews(DataItem item, TiUIView parentContent, TiBaseListViewItem rootItem,
										  boolean root)
	{

		Activity activity = getActivity();
		if (activity == null) {
			return;
		}

		ArrayList<DataItem> childrenItem = item.getChildren();
		for (int i = 0; i < childrenItem.size(); i++) {
			DataItem child = childrenItem.get(i);
			TiViewProxy proxy = child.getViewProxy();
			proxy.setActivity(activity);
			TiUIView view = proxy.createView(proxy.getActivity());
			view.registerForTouch();
			proxy.setView(view);
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

	public void appendExtraEventData(TiUIView view, int itemIndex, int sectionIndex, String bindId, String itemId)
	{
		KrollDict existingData = view.getAdditionalEventData();
		if (existingData == null) {
			existingData = new KrollDict();
			view.setAdditionalEventData(existingData);
		}

		//itemIndex = realItemIndex + header (if exists). We want the real item index.
		if (headerTitle != null || headerView != null) {
			itemIndex -= 1;
		}

		existingData.put(TiC.PROPERTY_SECTION, this);
		existingData.put(TiC.PROPERTY_SECTION_INDEX, sectionIndex);
		int realItemIndex = itemIndex;
		if (isFilterOn()) {
			realItemIndex = filterIndices.get(itemIndex);
		}
		existingData.put(TiC.PROPERTY_ITEM_INDEX, realItemIndex);

		if (!bindId.startsWith(TiListViewTemplate.GENERATED_BINDING) && !bindId.equals(TiC.PROPERTY_PROPERTIES)) {
			existingData.put(TiC.PROPERTY_BIND_ID, bindId);
		} else if (existingData.containsKey(TiC.PROPERTY_BIND_ID)) {
			existingData.remove(TiC.PROPERTY_BIND_ID);
		}

		if (itemId != null) {
			existingData.put(TiC.PROPERTY_ITEM_ID, itemId);
		} else if (existingData.containsKey(TiC.PROPERTY_ITEM_ID)) {
			existingData.remove(TiC.PROPERTY_ITEM_ID);
		}
	}

	public void populateViews(KrollDict data, TiBaseListViewItem cellContent, TiListViewTemplate template,
							  int itemIndex, int sectionIndex, View item_layout)
	{
		Object cell = cellContent.getTag();
		//Handling root item, since that is not in the views map.
		if (!(cell instanceof TiListItem)) {
			Log.e(TAG, "Cell is not TiListItem. Something is wrong..", Log.DEBUG_MODE);
			return;
		}

		TiListItem listItem = (TiListItem) cell;
		KrollDict listItemProperties;
		String itemId = null;

		if (data.containsKey(TiC.PROPERTY_PROPERTIES)) {
			listItemProperties = new KrollDict((HashMap) data.get(TiC.PROPERTY_PROPERTIES));
		} else {
			listItemProperties = template.getRootItem().getDefaultProperties();
		}

		//find out if we need to update itemId
		if (listItemProperties.containsKey(TiC.PROPERTY_ITEM_ID)) {
			itemId = TiConvert.toString(listItemProperties.get(TiC.PROPERTY_ITEM_ID));
		}

		//update extra event data for list item
		appendExtraEventData(listItem, itemIndex, sectionIndex, TiC.PROPERTY_PROPERTIES, itemId);

		HashMap<String, ViewItem> views = (HashMap<String, ViewItem>) cellContent.getViewsMap();
		//Loop through all our views and apply default properties
		for (String binding : views.keySet()) {
			DataItem dataItem = template.getDataItem(binding);
			ViewItem viewItem = views.get(binding);
			TiUIView view = viewItem.getView();
			KrollProxy viewProxy = null;
			//update extra event data for views
			if (view != null) {
				viewProxy = view.getProxy();
				appendExtraEventData(view, itemIndex, sectionIndex, binding, itemId);
			}
			//if binding is contain in data given to us, process that data, otherwise
			//apply default properties.
			if (data.containsKey(binding) && view != null) {
				KrollDict properties = new KrollDict((HashMap) data.get(binding));
				KrollDict diffProperties = viewItem.generateDiffProperties(properties);
				if (!diffProperties.isEmpty()) {
					if (viewProxy != null && viewProxy.getProperties() != null) {
						viewProxy.getProperties().putAll(diffProperties);
					}
					view.processProperties(diffProperties);
				}

			} else if (dataItem != null && view != null) {
				KrollDict diffProperties = viewItem.generateDiffProperties(dataItem.getDefaultProperties());
				if (!diffProperties.isEmpty()) {
					if (viewProxy != null && viewProxy.getProperties() != null) {
						viewProxy.getProperties().putAll(diffProperties);
					}
					view.processProperties(diffProperties);
				}
			} else {
				Log.w(TAG, "Sorry, " + binding + " isn't a valid binding. Perhaps you made a typo?", Log.DEBUG_MODE);
			}
		}

		//process listItem properties
		if (cellContent.getViewItem() != null) {
			KrollDict listItemDiff = cellContent.getViewItem().generateDiffProperties(listItemProperties);
			if (!listItemDiff.isEmpty()) {
				listItem.processProperties(listItemDiff);
			}
		}
	}

	public TiListViewTemplate getTemplateByIndex(int index)
	{
		if (headerTitle != null || headerView != null) {
			index -= 1;
		}

		if (isFilterOn()) {
			return listItemData.get(filterIndices.get(index)).getTemplate();
		} else {
			return listItemData.get(index).getTemplate();
		}
	}

	public int getContentCount()
	{
		if (isFilterOn()) {
			return filterIndices.size();
		} else {
			return itemCount;
		}
	}

	/**
	 * @return number of entries within section
	 */
	public int getItemCount()
	{
		int totalCount = 0;

		if (isFilterOn()) {
			totalCount = filterIndices.size();
		} else {
			totalCount = itemCount;
		}

		if (!hideHeaderOrFooter()) {
			if (headerTitle != null || headerView != null) {
				totalCount += 1;
			}
			if (footerTitle != null || footerView != null) {
				totalCount += 1;
			}
		}
		return totalCount;
	}

	private boolean hideHeaderOrFooter()
	{
		TiListView listview = getListView();
		return (listview.getSearchText() != null && filterIndices.isEmpty());
	}

	public boolean hasHeader()
	{
		return (headerTitle != null || headerView != null);
	}

	public boolean isHeaderView(int pos)
	{
		return (headerView != null && pos == 0);
	}

	public boolean isFooterView(int pos)
	{
		return (footerView != null && pos == getItemCount() - 1);
	}

	public boolean isHeaderTitle(int pos)
	{
		return (headerTitle != null && pos == 0);
	}

	public boolean isFooterTitle(int pos)
	{
		return (footerTitle != null && pos == getItemCount() - 1);
	}

	public void setListView(TiListView listView)
	{
		// Store a weak reference to the given ListView.
		this.listView = new WeakReference<TiListView>(listView);

		// Updates this proxy to use the given ListView's activity. Will end up using its theme.
		// Note: Odds are this proxy was initialized with the previous activity upon creation.
		if (listView != null) {
			TiViewProxy listViewProxy = listView.getProxy();
			if ((listViewProxy != null) && (listViewProxy.getActivity() != null)) {
				setActivity(listViewProxy.getActivity());
			}
		}
	}

	public TiListView getListView()
	{
		if (listView != null) {
			return listView.get();
		}
		return null;
	}

	/**
	 * Attempt to give each existing template a type, if possible
	 */
	public void setTemplateType()
	{

		for (int i = 0; i < listItemData.size(); i++) {
			TiListViewTemplate temp = listItemData.get(i).getTemplate();
			TiListView listView = getListView();
			if (temp.getType() == -1) {
				temp.setType(listView.getItemType());
			}
		}
	}

	public KrollDict getListItemData(int position)
	{
		if (headerTitle != null || headerView != null) {
			position -= 1;
		}

		if (isFilterOn()) {
			return listItemData.get(filterIndices.get(position)).getProperties();
		} else if (position >= 0 && position < listItemData.size()) {
			return listItemData.get(position).getProperties();
		}
		return null;
	}

	public boolean isFilterOn()
	{
		TiListView lv = getListView();
		if (lv != null && lv.getSearchText() != null) {
			return true;
		}
		return false;
	}

	public int applyFilter(String searchText)
	{
		//Clear previous result
		filterIndices.clear();
		boolean caseInsensitive = getListView().getCaseInsensitive();
		//Add new results
		for (int i = 0; i < listItemData.size(); ++i) {
			String searchableText = listItemData.get(i).getSearchableText();
			//Handle case sensitivity
			if (caseInsensitive) {
				searchText = searchText.toLowerCase();
				searchableText = searchableText.toLowerCase();
			}
			//String comparison
			if (searchableText.contains(searchText)) {
				filterIndices.add(i);
			}
		}
		return filterIndices.size();
	}

	public void release()
	{
		if (listItemData != null) {
			listItemData.clear();
			listItemData = null;
		}

		if (itemProperties != null) {
			itemProperties.clear();
			itemProperties = null;
		}

		if (builtInTemplate != null) {
			builtInTemplate.release();
			builtInTemplate = null;
		}
		super.release();
	}

	public void releaseViews()
	{
		listView = null;
	}

	@Override
	public String getApiName()
	{
		return "Ti.UI.ListSection";
	}
}

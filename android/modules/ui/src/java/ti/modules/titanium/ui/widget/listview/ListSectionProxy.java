package ti.modules.titanium.ui.widget.listview;

import java.lang.ref.WeakReference;
import java.util.ArrayList;
import java.util.HashMap;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.UIModule;
import ti.modules.titanium.ui.ViewProxy;
import ti.modules.titanium.ui.widget.listview.TiListView.TiBaseAdapter;
import ti.modules.titanium.ui.widget.listview.TiTemplate.DataItem;
import android.os.Handler;
import android.os.Message;
import android.util.SparseArray;

@Kroll.proxy(creatableInModule = UIModule.class, propertyAccessors = {
})
public class ListSectionProxy extends ViewProxy{

	private static final String TAG = "SectionProxy";
	private ArrayList<KrollDict> entryProperties;
	private SparseArray<TiTemplate> templatesByIndex;
	private int itemCount;
	private DefaultTemplate builtInTemplate;
	private TiBaseAdapter adapter;
	
	private String headerTitle;
	private String footerTitle;
	
	private WeakReference<TiListView> listView;
	
	private static final int MSG_FIRST_ID = TiViewProxy.MSG_LAST_ID + 1;

	private static final int MSG_SET_ITEM = MSG_FIRST_ID + 700;
	
	public ListSectionProxy () {
		//initialize variables
		entryProperties = new ArrayList<KrollDict>();
		templatesByIndex = new SparseArray<TiTemplate>();
		itemCount = 0;
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

		case MSG_SET_ITEM: {
			handleSetItem(msg.obj);
		}

		default : {
			return super.handleMessage(msg);
		}

		}

	}
	
	@Kroll.method
	public void setItems(Object data) {
		if (TiApplication.isUIThread()) {
			handleSetItem(data);
		} else {
			Handler handler = getMainHandler();
			handler.sendMessage(handler.obtainMessage(MSG_SET_ITEM, data));
		}
		
	}
	
	private void handleSetItem(Object data) {

		if (data instanceof Object[]) {
			Object[] views = (Object[]) data;
			int count = views.length;
			itemCount = count;

			//First pass through data, we process template and update
			//default properties based data given
			for (int i = 0; i < count; i++) {
				Object itemData = views[i];
				if (itemData instanceof HashMap) {
					KrollDict d = new KrollDict((HashMap)itemData);
					TiTemplate template = processTemplate(d, i);
					template.updateDefaultProperties(d);
				}
			}
			//Second pass we would merge properties
			for (int i = 0; i < count; i++) {
				Object itemData = views[i];
				if (itemData instanceof HashMap) {
					KrollDict d = new KrollDict((HashMap)itemData);
					TiTemplate template = templatesByIndex.get(i);
					if (template != null) {
						template.mergeWithDefaultProperties(d);
					}
					d.remove(TiC.PROPERTY_TEMPLATE);
					entryProperties.add(d);
				}
			}
			//Notify adapter that data has changed.
			if (adapter != null) {
				adapter.notifyDataSetChanged();
			}
		} else {
			Log.e(TAG, "Invalid argument type to setData");
		}
	}
	
	private TiTemplate processTemplate(KrollDict itemData, int index) {
		
		TiListView listView = getListView();
		String defaultTemplateBinding = null;
		if (listView != null) {
			defaultTemplateBinding = listView.getDefaultTemplateBinding();
		}
		//if template is specified in data, we look it up and if one exists, we use it.
		//Otherwise we check if a default template is specified in ListView. If not, we use builtInTemplate.
		if (itemData.containsKey(TiC.PROPERTY_TEMPLATE)) {
			//retrieve template
			String binding = TiConvert.toString(itemData.get(TiC.PROPERTY_TEMPLATE));
			//check if template is default
			if (binding != null && binding.equals(UIModule.LIST_ITEM_TEMPLATE_DEFAULT)) {
				return processDefaultTemplate(itemData, index);
			}

			TiTemplate template = listView.getTemplateByBinding(binding);
			//if template is successfully retrieved, bind it to the index. This is b/c
			//each row can have a different template.
			if (template != null) {
				templatesByIndex.put(index, template);
			} else {
				Log.e(TAG, "Template undefined");
			}
						
			return template;
			
		} else {
			//if a valid default template is specify, use that one
			if (defaultTemplateBinding != null && !defaultTemplateBinding.equals(UIModule.LIST_ITEM_TEMPLATE_DEFAULT)) {
				TiTemplate defTemplate = listView.getTemplateByBinding(defaultTemplateBinding);
				if (defTemplate != null) {
					templatesByIndex.put(index, defTemplate);
					return defTemplate;
				}
			}
			return processDefaultTemplate(itemData, index);
		}	
		
	}
	
	private TiTemplate processDefaultTemplate(KrollDict data, int index) {
		if (builtInTemplate != null){
			templatesByIndex.put(index, builtInTemplate);
		} else {
			//Create template and generate default properties
			builtInTemplate = new DefaultTemplate(UIModule.LIST_ITEM_TEMPLATE_DEFAULT, null);
			builtInTemplate.generateDefaultProps(getActivity());
			//Each template is treated as an item type, so we can reuse views efficiently.
			//Section templates are given a type in TiListView.processSections(). Here we
			//give default template a type if possible.
			TiListView listView = getListView();
			if (listView != null) {
				builtInTemplate.setType(listView.getItemType());
			}
			templatesByIndex.put(index, builtInTemplate);
		}

		return builtInTemplate;
	}

	/**
	 * This method creates a new cell and fill it with content. getView() calls this method
	 * when a view needs to be created.
	 * @param index Entry's index relative to its section
	 * @return
	 */
	public void generateCellContent(int index, KrollDict data, TiTemplate template, TiBaseListViewItem itemContent, int itemPosition) {
		//Here we create an item content and populate it with data
		//Get item proxy
		TiViewProxy itemProxy = template.getRootItem().getViewProxy();
		//Create corresponding TiUIView for item proxy
		TiListItem item = new TiListItem(itemProxy);	
		item.setNativeView(itemContent);
		
		//Connect native view with TiUIView so we can get it from recycled view.
		itemContent.setTag(item);
	
		if (data != null && template != null) {
			generateChildContentViews(template.getRootItem(), null, itemContent, true);
			populateViews(data, itemContent, template, itemPosition, index);
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
			rootItem.bindView(child.getBindingId(), view);
			//Process default properties
			view.processProperties(child.getDefaultProperties());
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
			view.setAddtionalEventData(existingData);
		}
		existingData.put(TiC.PROPERTY_SECTION, this);
		existingData.put(TiC.PROPERTY_SECTION_INDEX, sectionIndex);
		existingData.put(TiC.PROPERTY_BIND_ID, bindId);
		existingData.put(TiC.PROPERTY_ITEM_INDEX, itemPosition);
	}
	
	public void populateViews(KrollDict data, TiBaseListViewItem cellContent, TiTemplate template, int itemPosition, int sectionIndex) {
		Object cell = cellContent.getTag();
		if (cell instanceof TiUIView) {
			((TiUIView) cell).processProperties(template.getRootItem().getDefaultProperties());
		}
		HashMap<String, TiUIView> views = cellContent.getViewsMap();
		//Loop through all our views and apply default properties
		for (String binding: views.keySet()) {
			
			DataItem dataItem = template.getDataItem(binding);
			TiUIView view = views.get(binding);
			if (view != null) {
				appendExtraEventData(view, itemPosition, sectionIndex, binding);
			}
			//if view doesn't have binding, we don't need to re-apply properties since
			//we know users can't change any properties. If data contains view, we don't
			//need to apply default properties b/c data properties is merged with default
			//properties and we handle it when we loop through data.
			if (binding.startsWith(TiTemplate.GENERATED_BINDING) ||
				data.containsKey(binding)) continue;
			
			if (dataItem != null && view != null) {
				view.processProperties(dataItem.getDefaultProperties());
			}
			
			
		}

		for (String key : data.keySet()) {
			KrollDict properties = new KrollDict((HashMap)data.get(key));
			
			if (key.equals(template.getItemID()) && cell instanceof TiUIView) {
				((TiUIView) cell).processProperties(template.getRootItem().getDefaultProperties());
				continue;
			}

			TiUIView view = cellContent.getViewFromBinding(key);
			if (view != null) {
				view.processProperties(properties);
			}
		}
	}
	
	public void createChildView(TiViewProxy proxy, String binding, KrollDict properties, TiBaseListViewItem viewGroup) {

		TiUIView childView = proxy.createView(proxy.getActivity());
		
		if (childView != null) {
			childView.processProperties(properties);
			viewGroup.addView(childView.getNativeView(), childView.getLayoutParams());
			viewGroup.bindView(binding, childView);
		}
	}
	
	public TiTemplate getTemplateByIndex(int index) {
		if (headerTitle != null) {
			index -= 1;
		}
		return templatesByIndex.get(index);
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
		
		for (int i = 0; i < templatesByIndex.size(); i++) {
			TiTemplate temp = templatesByIndex.get(i);
			if (temp.getType() == -1) {
				temp.setType(getListView().getItemType());
			}
		}
	}
	
	public KrollDict getEntryProperties(int position) {
		if (headerTitle != null) {
			position -= 1;
		}

		if (position < entryProperties.size()) {
			return entryProperties.get(position);
		} 
		return null;
	}
	
}

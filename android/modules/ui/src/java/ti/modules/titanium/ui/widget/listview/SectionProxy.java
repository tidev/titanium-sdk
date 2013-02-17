package ti.modules.titanium.ui.widget.listview;

import java.lang.ref.WeakReference;
import java.util.ArrayList;
import java.util.HashMap;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiCompositeLayout;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.ImageViewProxy;
import ti.modules.titanium.ui.LabelProxy;
import ti.modules.titanium.ui.UIModule;
import ti.modules.titanium.ui.ViewProxy;
import ti.modules.titanium.ui.widget.TiUIImageView;
import ti.modules.titanium.ui.widget.TiUILabel;
import ti.modules.titanium.ui.widget.listview.TiListView.TiBaseAdapter;
import android.util.SparseArray;
import android.view.ViewGroup.LayoutParams;
import android.widget.AbsListView;

@Kroll.proxy(creatableInModule = UIModule.class, propertyAccessors = {
	TiC.PROPERTY_HEADER_TITLE
})
public class SectionProxy extends ViewProxy{

	private static final String TAG = "SectionProxy";
	private ArrayList<KrollDict> entryProperties;
	private SparseArray<TiTemplate> templatesByIndex;
	private int itemCount;
	private TiTemplate defaultTemplate;
	private TiBaseAdapter adapter;
	
	private WeakReference<TiListView> listView;
	
	public SectionProxy () {
		//initialize variables
		entryProperties = new ArrayList<KrollDict>();
		templatesByIndex = new SparseArray<TiTemplate>();
		itemCount = 0;
	}
	
	public void setAdapter(TiBaseAdapter a) {
		adapter = a;
	}
	@Kroll.method
	public void setData(Object data) {
		if (data instanceof Object[]) {
			Object[] views = (Object[]) data;
			int count = views.length;
			itemCount = count;
			for (int i = 0; i < count; i++) {
				Object itemData = views[i];
				if (itemData instanceof HashMap) {
					KrollDict d = new KrollDict((HashMap)itemData);
					processData(d, i);
					entryProperties.add(d);
				}
			}
			if (adapter != null) {
				adapter.notifyDataSetChanged();
			}
		} else {
			Log.e(TAG, "Invalid argument type to setData");
		}
	}
	
	private void processData(KrollDict itemData, int index) {
		//if template is specified, we look it up and if one exists, we use it,
		//otherwise we use default template.
		if (itemData.containsKey(TiC.PROPERTY_TEMPLATE)) {
			//retrieve template
			String binding = TiConvert.toString(itemData.get(TiC.PROPERTY_TEMPLATE));
			TiTemplate template = getListView().getTemplateByBinding(binding);
			//if template is successfully retrieved, bind it to the index. This is b/c
			//each row can have a different template.
			if (template != null) {
				templatesByIndex.put(index, template);
			}
		} else {
			if (defaultTemplate != null){
				templatesByIndex.put(index, defaultTemplate);
			} else {
				//create template and generate default properties
				defaultTemplate = new TiTemplate(TiTemplate.DEFAULT_TEMPLATE, null);
				defaultTemplate.generateDefaultProps(getActivity());
				TiListView listView = getListView();
				if (listView != null) {
					defaultTemplate.setType(listView.getItemType());
				}
				templatesByIndex.put(index, defaultTemplate);
			}
		}
		
		
		
	}
	public TiCompositeLayout generateView(int index) {
		TiBaseListViewItem cell = new TiBaseListViewItem(getActivity());
		//TiListCell cell = new TiListCell(viewGroup);
		//KrollDict d = new KrollDict();
		//d.put("backgroundColor", "blue");
		//cell.processProperties(d);
		KrollDict data = getEntryProperties(index);
		TiTemplate template = getTemplateByIndex(index);
		if (data != null && template != null) {
			populateViews(data, cell, template);
		}
		return cell;
	}
	
	public void populateViews(KrollDict data, TiBaseListViewItem viewGroup, TiTemplate template) {
		
		for (String key : data.keySet()) {
			KrollDict properties = new KrollDict((HashMap)data.get(key));
			if (template.getTemplateID() == TiTemplate.DEFAULT_TEMPLATE) {
				if (key.equals("title")) {
					properties = template.mergeProperties(template.getDefaultLabelProperties(), properties);
				} else if (key.equals("leftImage")) {
					properties = template.mergeProperties(template.getDefaultImageProperties(), properties);
				}
			}
			TiUIView view = viewGroup.getViewFromBinding(key);
			if (view != null) {
				view.processProperties(properties);
				continue;
			}
			//check if key is bound
			TiViewProxy proxy = template.getViewProxy(key);
			if (proxy != null) {
				createChildView(proxy, key, properties, viewGroup);
			}
		}
	}
	
	public void createChildView(TiViewProxy proxy, String binding, KrollDict properties, TiBaseListViewItem viewGroup) {

		Class<? extends TiViewProxy> proxyClass = proxy.getClass();
		TiUIView childView = null;
		if (proxyClass.equals(LabelProxy.class)) {
			childView = new TiUILabel(proxy);
		} else if (proxyClass.equals(ImageViewProxy.class)) {
			childView = new TiUIImageView(proxy);
		}
		
		if (childView != null) {
			childView.processProperties(properties);
			viewGroup.addView(childView.getNativeView(), childView.getLayoutParams());
			viewGroup.bindView(binding, childView);
		}
	}
	
	public TiTemplate getTemplateByIndex(int index) {
		return templatesByIndex.get(index);
	}
	
	public int getItemCount() {
		return itemCount;
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
	
	public void setTemplateType() {
		
		for (int i = 0; i < templatesByIndex.size(); i++) {
			TiTemplate temp = templatesByIndex.get(i);
			if (temp.getType() == -1) {
				temp.setType(getListView().getItemType());
			}
		}
	}
	
	public KrollDict getEntryProperties(int position) {
		if (position < entryProperties.size()) {
			return entryProperties.get(position);
		} 
		return null;
	}
	
}

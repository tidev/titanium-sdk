/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package ti.modules.titanium.ui.widget.listview;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Set;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;

public class TiListViewTemplate {
	
	protected static final String TAG = "TiTemplate";

	protected HashMap<String, DataItem> dataItems;
	
	public static final String DEFAULT_TEMPLATE = "defaultTemplate";
	
	public static final String GENERATED_BINDING = "generatedBinding:";

	//Identifier for template, specified in ListView creation dict
	private String templateID;
	//Internal identifier for template, each template has a unique type
	private int templateType;
	
	protected DataItem rootItem;
	
	protected String itemID;
	//Properties of the template. 
	private KrollDict properties;
	
	public class DataItem {
		//proxy for the item
		TiViewProxy vProxy;
		//binding id
		String bindId;
		DataItem parent;
		ArrayList<DataItem> children;
		KrollDict defaultProperties;

		public DataItem(TiViewProxy proxy, String id, DataItem parent) {
			vProxy = proxy;
			bindId = id;
			this.parent = parent;
			setProxyParent();
			children = new ArrayList<DataItem>();
			defaultProperties = new KrollDict();
		}
		
		private void setProxyParent() {
			
			if (vProxy != null && parent != null) {
				TiViewProxy parentProxy = parent.getViewProxy();
				if (parentProxy != null) {
					vProxy.setParent(parentProxy);
				}
			}
		}
		
		public TiViewProxy getViewProxy() {
			return vProxy;
		}
		
		public String getBindingId() {
			return bindId;
		}
		public void setDefaultProperties(KrollDict d) {
			defaultProperties = d;
		}
		
		public KrollDict getDefaultProperties() {
			return defaultProperties;
		}

		public DataItem getParent() {
			return parent;
		}
		
		public ArrayList<DataItem> getChildren() {
			return children;
		}
		
		public void addChild(DataItem child) {
			children.add(child);
		}
		
		public void release() {
			if (vProxy != null) {
				vProxy.release();
				vProxy = null;
			}
			children.clear();
			parent = null;
		}
	}

	public TiListViewTemplate(String id, KrollDict properties) {
		//Init our binding hashmaps
		dataItems = new HashMap<String, DataItem>();

		//Set item id. Item binding is always "properties"
		itemID = TiC.PROPERTY_PROPERTIES;
		//Init vars.
		templateID = id;
		templateType = -1;
		if (properties != null) {
			this.properties = properties;
			processProperties(this.properties);
		} else {
			this.properties = new KrollDict();
		}
	
	}

	private DataItem bindProxiesAndProperties(KrollDict properties, boolean isRootTemplate, DataItem parent) {
		Object proxy = null;
		String id = null;
		Object props = null;
		DataItem item = null;
		if (properties.containsKey(TiC.PROPERTY_TI_PROXY)) {
			proxy = properties.get(TiC.PROPERTY_TI_PROXY);
		}

		//Get/generate random bind id
		if (isRootTemplate) {
			id = itemID;	
		} else if (properties.containsKey(TiC.PROPERTY_BIND_ID)) {
			id = TiConvert.toString(properties, TiC.PROPERTY_BIND_ID);
		} else {
			id = GENERATED_BINDING + Math.random();
		}
		

		if (proxy instanceof TiViewProxy) {
			TiViewProxy viewProxy = (TiViewProxy) proxy;
			if (isRootTemplate) {
				rootItem = item = new DataItem(viewProxy, TiC.PROPERTY_PROPERTIES, null);
			} else {
				item = new DataItem(viewProxy, id, parent);
				parent.addChild(item);
			}
			dataItems.put(id, item);
		}

		if (properties.containsKey(TiC.PROPERTY_PROPERTIES)) {
			props = properties.get(TiC.PROPERTY_PROPERTIES);
		}
		
		if (props instanceof HashMap) {
			item.setDefaultProperties(new KrollDict((HashMap)props));
		}

		return item;
	}

	private void processProperties(KrollDict properties) {
		bindProxiesAndProperties(properties, true, null);
		if (properties.containsKey(TiC.PROPERTY_CHILD_TEMPLATES)) {
			processChildProperties(properties.get(TiC.PROPERTY_CHILD_TEMPLATES), rootItem);
		}

	}
	
	private void processChildProperties(Object childProperties, DataItem parent) {
		if (childProperties instanceof Object[]) {
			Object[] propertiesArray = (Object[])childProperties;
			for (int i = 0; i < propertiesArray.length; i++) {
				HashMap<String, Object> properties = (HashMap<String, Object>) propertiesArray[i];
				//bind proxies and default properties
				DataItem item = bindProxiesAndProperties(new KrollDict(properties), false, parent);
				//Recursively calls for all childTemplates
				if (properties.containsKey(TiC.PROPERTY_CHILD_TEMPLATES)) {
					if(item == null) {
						Log.e(TAG, "Unable to generate valid data from child view", Log.DEBUG_MODE);
					}
					processChildProperties(properties.get(TiC.PROPERTY_CHILD_TEMPLATES), item);
				}
			}
		}
	}

	public String getTemplateID() {
		return templateID;
	}

	public void setType(int type) {
		templateType = type;
	}
	
	public int getType() {
		return templateType;
	}
	
	public String getItemID() {
		return itemID;
	}
	
	public void setRootParent(TiViewProxy listView) {
		ListItemProxy rootProxy = (ListItemProxy) rootItem.getViewProxy();
		if (rootProxy != null && rootProxy.getListProxy() == null) {
			rootProxy.setListProxy(listView);
		}
	}
	
	/**
	 * Returns the bound view proxy if exists.
	 */
	public DataItem getDataItem(String binding) {
		return dataItems.get(binding);	
	}

	public DataItem getRootItem() {
		return rootItem;
	}

	public void updateOrMergeWithDefaultProperties(KrollDict data, boolean update) {
		for (String binding: data.keySet()) {
			DataItem dataItem = dataItems.get(binding);
			if (dataItem == null) continue;

			KrollDict defaultProps = dataItem.getDefaultProperties();
			KrollDict props = new KrollDict((HashMap)data.get(binding));
			if (defaultProps != null) {
				if (update) {
					//update default properties
					Set<String> existingKeys = defaultProps.keySet();
					for (String key:  props.keySet()) {
						if (!existingKeys.contains(key)) {
							defaultProps.put(key, null);
						}
					}
				} else {
					//merge default properties with new properties and update data
					HashMap<String, Object> newData = ((HashMap<String, Object>)defaultProps.clone());
					newData.putAll(props);
					data.put(binding, newData);
				}
			}
		}

	}
	
	public void release () {
		for (int i = 0; i < dataItems.size(); i++) {
			DataItem item = dataItems.get(i);
			if (item != null) {
				item.release();
			}
		}
		dataItems.clear();
		if (rootItem != null) {
			rootItem.release();
			rootItem = null;
		}
	}
}

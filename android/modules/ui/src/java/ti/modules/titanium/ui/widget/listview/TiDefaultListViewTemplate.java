/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget.listview;

import java.util.HashMap;
import java.util.Iterator;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.util.TiConvert;

import ti.modules.titanium.ui.ImageViewProxy;
import ti.modules.titanium.ui.LabelProxy;
import android.app.Activity;

public class TiDefaultListViewTemplate extends TiListViewTemplate {

	public TiDefaultListViewTemplate(String id, KrollDict properties, Activity activity) {
		super(id, properties);
		generateDefaultProps(activity);
	}
	
	public void generateDefaultProps(Activity activity) {
		
		//Generate root item data proxy
		ListItemProxy proxy = new ListItemProxy();
		proxy.setActivity(activity);
		rootItem = new DataItem(proxy, TiC.PROPERTY_PROPERTIES, null);
		dataItems.put(itemID, rootItem);

		//Init default properties for our proxies
		KrollDict defaultLabelProperties = new KrollDict();
		KrollDict defaultImageProperties = new KrollDict();

		//Generate label proxy
		LabelProxy labelProxy = new LabelProxy();
		labelProxy.getProperties().put(TiC.PROPERTY_TOUCH_ENABLED, false);
		labelProxy.setActivity(activity);
		//Generate properties
		defaultLabelProperties.put(TiC.PROPERTY_LEFT, "2dp");
		defaultLabelProperties.put(TiC.PROPERTY_WIDTH, "55%");
		defaultLabelProperties.put(TiC.PROPERTY_TEXT, "label");
		//bind the proxy and default propertiess
		DataItem labelItem = new DataItem(labelProxy, TiC.PROPERTY_TITLE, rootItem);
		dataItems.put(TiC.PROPERTY_TITLE, labelItem);
		//set default properties
		labelItem.setDefaultProperties(defaultLabelProperties);
		//add child
		rootItem.addChild(labelItem);
		
		//Generate image proxy
		ImageViewProxy imageProxy = new ImageViewProxy();
		imageProxy.getProperties().put(TiC.PROPERTY_TOUCH_ENABLED, false);
		imageProxy.setActivity(activity);
		//Generate properties
		defaultImageProperties.put(TiC.PROPERTY_RIGHT, "25dp");
		defaultImageProperties.put(TiC.PROPERTY_WIDTH, "15%");
		//bind the proxy and default properties
		DataItem imageItem = new DataItem (imageProxy, TiC.PROPERTY_IMAGE, rootItem);
		dataItems.put(TiC.PROPERTY_IMAGE, imageItem);
		//set default properties
		imageItem.setDefaultProperties(defaultImageProperties);
		//add child
		rootItem.addChild(imageItem);
		

	}
	private void parseDefaultData(KrollDict data) {
		//for built-in template, we only process 'properties' key
		Iterator<String> bindings = data.keySet().iterator();
		while (bindings.hasNext()) {
			String binding = bindings.next();
			if (!binding.equals(TiC.PROPERTY_PROPERTIES)) {
				Log.e(TAG, "Please only use 'properties' key for built-in template", Log.DEBUG_MODE);
				bindings.remove();
			}
		}

		KrollDict properties = data.getKrollDict(TiC.PROPERTY_PROPERTIES);
		KrollDict clone_properties = new KrollDict((HashMap)properties);
		if (clone_properties.containsKey(TiC.PROPERTY_TITLE)) {
			KrollDict text = new KrollDict();
			text.put(TiC.PROPERTY_TEXT, TiConvert.toString(clone_properties, TiC.PROPERTY_TITLE));
			data.put(TiC.PROPERTY_TITLE, text);
			if (clone_properties.containsKey(TiC.PROPERTY_FONT)) {
				text.put(TiC.PROPERTY_FONT, clone_properties.getKrollDict(TiC.PROPERTY_FONT).clone());
				clone_properties.remove(TiC.PROPERTY_FONT);
			}
			if (clone_properties.containsKey(TiC.PROPERTY_COLOR)) {
				text.put(TiC.PROPERTY_COLOR, clone_properties.get(TiC.PROPERTY_COLOR));
				clone_properties.remove(TiC.PROPERTY_COLOR);
			}
			clone_properties.remove(TiC.PROPERTY_TITLE);
		}
		
		if (clone_properties.containsKey(TiC.PROPERTY_IMAGE)) {
			KrollDict image = new KrollDict();
			image.put(TiC.PROPERTY_IMAGE, TiConvert.toString(clone_properties, TiC.PROPERTY_IMAGE));
			data.put(TiC.PROPERTY_IMAGE, image);
			clone_properties.remove(TiC.PROPERTY_IMAGE);
		}
		
		data.put(TiC.PROPERTY_PROPERTIES, clone_properties);
	}
	
	public void updateOrMergeWithDefaultProperties(KrollDict data, boolean update) {

		if (!data.containsKey(TiC.PROPERTY_PROPERTIES)) {
			Log.e(TAG, "Please use 'properties' binding for builtInTemplate");
			if (!update) {
				//apply default behavior
				data.clear();
			}
			return;
		}
		parseDefaultData(data);
		super.updateOrMergeWithDefaultProperties(data, update);
	}
	
}

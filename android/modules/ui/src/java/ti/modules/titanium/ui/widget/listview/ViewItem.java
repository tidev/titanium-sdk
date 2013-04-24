/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package ti.modules.titanium.ui.widget.listview;

import java.util.HashMap;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.titanium.view.TiUIView;

public class ViewItem {
	TiUIView view;
	KrollDict properties;
	KrollDict diffProperties;
	
	public ViewItem(TiUIView view, KrollDict props) {
		properties = new KrollDict((HashMap<String, Object>)props.clone());
		this.view = view;
		diffProperties = new KrollDict();
	}
	
	public TiUIView getView() {
		return view;
	}
	
	/**
	 * This method compares applied properties of a view and our data model to
	 * generate a new set of properties we need to set. It is crucial for scrolling performance. 
	 * @param properties The properties from our data model
	 * @return The difference set of properties to set
	 */
	public KrollDict generateDiffProperties(KrollDict properties) {
		diffProperties.clear();

		for (String appliedProp : this.properties.keySet()) {
			if (!properties.containsKey(appliedProp)) {
				applyProperty(appliedProp, null);
			}
		}
		
		for (String property : properties.keySet()) {
			Object value = properties.get(property);
			if (TiListView.MUST_SET_PROPERTIES.contains(property)) {
				applyProperty(property, value);
				continue;
			}

			Object existingVal = this.properties.get(property);			
			if (existingVal == null || value == null || !existingVal.equals(value)) {
				applyProperty(property, value);
			}
		}
		return diffProperties;
		
	}
	
	private void applyProperty(String key, Object value) {
		diffProperties.put(key, value);
		properties.put(key, value);
	}
	
	
}
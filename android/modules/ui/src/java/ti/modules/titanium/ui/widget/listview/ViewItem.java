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
	
	public KrollDict generateDiffProperties(KrollDict properties) {
		diffProperties.clear();
		for (String property : properties.keySet()) {
			Object value = properties.get(property);
			if (TiListView.MUST_SET_PROPERTIES.contains(property)) {
				diffProperties.put(property, value);
				this.properties.put(property, value);
				continue;
			}

			boolean isContain = this.properties.containsKey(property);
			Object existingVal = this.properties.get(property);
			if (!isContain || (isContain && existingVal == null) || (isContain && !existingVal.equals(value))) {
				diffProperties.put(property, value);
				this.properties.put(property, value);
			}
		}
		return diffProperties;
		
	}
	
	
}
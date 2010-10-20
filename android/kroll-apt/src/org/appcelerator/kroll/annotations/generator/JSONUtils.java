/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll.annotations.generator;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.lang.model.element.AnnotationMirror;

@SuppressWarnings("unchecked")
public class JSONUtils {
	protected KrollAnnotationUtils annUtils;
	
	public JSONUtils(KrollAnnotationUtils annUtils) {
		this.annUtils = annUtils;
	}
	
	public Map<Object,Object> getOrCreateMap(Map<Object,Object> map, String name) {
		Map<Object,Object> subMap = (Map<Object,Object>) map.get(name);
		if (subMap == null) {
			subMap = new HashMap<Object,Object>();
			map.put(name, subMap);
		}
		return subMap;
	}
	
	public List<Object> getOrCreateList(Map<Object,Object> map, String name) {
		List<Object> list = (List<Object>) map.get(name);
		if (list == null) {
			list = new ArrayList<Object>();
			map.put(name, list);
		}
		return list;
	}
	
	public void appendUnique(Map<Object,Object> parent, String arrayName, Object value) {
		appendUnique(getOrCreateList(parent, arrayName), value);
	}
	
	public void appendUnique(List<Object> list, Object value) {
		// treat the array like a set
		boolean found = false;
		for (int i = 0; i < list.size(); i++) {
			if (list.get(i).equals(value)) {
				found = true;
				break;
			}
		}
		
		if (!found) {
			list.add(value);
		}
	}
	
	public void updateObjectFromAnnotation(Map<Object,Object> object, AnnotationMirror annotation) {
		updateObjectFromAnnotationParams(object, annUtils.getAnnotationParams(annotation));
	}
	
	public void updateObjectFromAnnotationParams(Map<Object,Object> object, HashMap<String, Object> params) {
		for (String key : params.keySet()) {
			Object value = params.get(key);
			if (object.containsKey(key)) {
				Object currentValue = object.get(key);
				if (currentValue instanceof List && value instanceof List) {
					List<Object> currentList = (List<Object>)currentValue;
					for (int i = 0; i < currentList.size(); i++) {
						appendUnique(currentList, ((List<Object>)value).get(i));
					}
				} else if (value instanceof Class<?>) {
					object.put(key, ((Class<?>)value).getName());
				} else {
					object.put(key, value);
				}
			} else {
				object.put(key, value);
			}
		}
	}
}

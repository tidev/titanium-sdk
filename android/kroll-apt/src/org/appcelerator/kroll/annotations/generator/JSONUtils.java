package org.appcelerator.kroll.annotations.generator;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.lang.model.element.AnnotationMirror;

public class JSONUtils {
	protected KrollAnnotationUtils annUtils;
	
	public JSONUtils(KrollAnnotationUtils annUtils) {
		this.annUtils = annUtils;
	}
	
	@SuppressWarnings("unchecked")
	public Map<?,?> getOrCreateMap(Map map, String name) {
		Map<?,?> subMap = (Map<?,?>) map.get(name);
		if (subMap == null) {
			subMap = new HashMap<Object,Object>();
			map.put(name, subMap);
		}
		return subMap;
	}
	
	@SuppressWarnings("unchecked")
	public List<?> getOrCreateList(Map map, String name) {
		List<?> list = (List<?>) map.get(name);
		if (list == null) {
			list = new ArrayList<Object>();
			map.put(name, list);
		}
		return list;
	}
	
	@SuppressWarnings("unchecked")
	public void appendUnique(Map parent, String arrayName, Object value) {
		appendUnique(getOrCreateList(parent, arrayName), value);
	}
	
	@SuppressWarnings("unchecked")
	public void appendUnique(List list, Object value) {
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
	
	@SuppressWarnings("unchecked")
	public void updateObjectFromAnnotation(Map object, AnnotationMirror annotation) {
		updateObjectFromAnnotationParams(object, annUtils.getAnnotationParams(annotation));
	}
	
	@SuppressWarnings("unchecked")
	public void updateObjectFromAnnotationParams(Map object, HashMap<String, Object> params) {
		for (String key : params.keySet()) {
			Object value = params.get(key);
			if (object.containsKey(key)) {
				Object currentValue = object.get(key);
				if (currentValue instanceof List && value instanceof List) {
					List currentList = (List)currentValue;
					for (int i = 0; i < currentList.size(); i++) {
						appendUnique(currentList, ((List)value).get(i));
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

/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll.annotations.generator;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

import javax.lang.model.element.AnnotationMirror;

@SuppressWarnings("unchecked")
public class JSONUtils
{
	protected KrollAnnotationUtils annUtils;

	public JSONUtils()
	{
	}

	public JSONUtils(KrollAnnotationUtils annUtils)
	{
		this.annUtils = annUtils;
	}

	public Map<Object, Object> getMap(Map<? extends Object, Object> map, String name)
	{
		return (Map<Object, Object>) map.get(name);
	}

	public Map<String, Object> getStringMap(Map<? extends Object, Object> map, String name)
	{
		return (Map<String, Object>) map.get(name);
	}

	/**
	 * Names of the lists in the bindings tree whose element order is meaningless. Their contents are appended in
	 * the order the annotation processor happens to visit the proxy classes, which varies between full and
	 * incremental compiles. They get sorted by the below method so that the generated output is deterministic.
	 */
	private static final List<String> UNORDERED_LIST_NAMES = List.of("createProxies", "childModules");

	/**
	 * Creates a deep copy of the given bindings tree with a deterministic ordering:
	 * all maps are sorted by key and lists named in "UNORDERED_LIST_NAMES" are sorted by the "id"/"proxyClassName"
	 * of their entries. All other lists (method arguments, etc.) keep their order since it is meaningful.
	 * <p>
	 * This makes the generated JSON and C++ files identical regardless of which order the annotation processor
	 * visited the classes in. That order changes between full and incremental Java compiles, and without this,
	 * every incremental compile would rewrite the C++ bindings and trigger a full native rebuild.
	 * @param value The value to copy. Typically a map, list, or primitive JSON value. Can be null.
	 * @return Returns a deep copy of the given value. Returns the given value as-is if it's not a map or list.
	 */
	public static Object toDeterministicCopy(Object value)
	{
		return toDeterministicCopy(value, null);
	}

	private static Object toDeterministicCopy(Object value, String name)
	{
		if (value instanceof Map) {
			Map<Object, Object> copy = new TreeMap<>(Comparator.comparing(String::valueOf));
			for (Map.Entry<?, ?> entry : ((Map<?, ?>) value).entrySet()) {
				copy.put(entry.getKey(), toDeterministicCopy(entry.getValue(), String.valueOf(entry.getKey())));
			}
			return copy;
		} else if (value instanceof List) {
			List<Object> copy = new ArrayList<>();
			for (Object element : (List<?>) value) {
				copy.add(toDeterministicCopy(element, null));
			}
			if ((name != null) && UNORDERED_LIST_NAMES.contains(name)) {
				copy.sort(Comparator.comparing(JSONUtils::getSortKey));
			}
			return copy;
		}
		return value;
	}

	private static String getSortKey(Object value)
	{
		if (value instanceof Map) {
			Map<?, ?> map = (Map<?, ?>) value;
			Object key = map.containsKey("id") ? map.get("id") : map.get("proxyClassName");
			if (key != null) {
				return String.valueOf(key);
			}
		}
		return String.valueOf(value);
	}

	public Map<Object, Object> getOrCreateMap(Map<Object, Object> map, String name)
	{
		Map<Object, Object> subMap = (Map<Object, Object>) map.get(name);
		if (subMap == null) {
			subMap = new HashMap<Object, Object>();
			map.put(name, subMap);
		}
		return subMap;
	}

	public List<Object> getOrCreateList(Map<Object, Object> map, String name)
	{
		List<Object> list = (List<Object>) map.get(name);
		if (list == null) {
			list = new ArrayList<Object>();
			map.put(name, list);
		}
		return list;
	}

	public void appendUnique(Map<Object, Object> parent, String arrayName, Object value)
	{
		appendUnique(getOrCreateList(parent, arrayName), value);
	}

	public void appendUnique(List<Object> list, Object value)
	{
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

	public void appendUniqueObject(Map<Object, Object> parent, String arrayName, Object key,
								   Map<? extends Object, Object> value)
	{
		appendUniqueObject(getOrCreateList(parent, arrayName), key, value);
	}

	public void appendUniqueObject(List<Object> list, Object key, Map<? extends Object, Object> value)
	{
		boolean found = false;
		for (int i = 0; i < list.size(); i++) {
			Object v = list.get(i);
			if (v instanceof Map) {
				Map<Object, Object> map = (Map<Object, Object>) v;
				Object mapValue = map.get(key);
				if (mapValue != null && value.get(key).equals(mapValue)) {
					found = true;
					break;
				}
			}
		}

		if (!found) {
			list.add(value);
		}
	}

	public void updateObjectFromAnnotation(Map<Object, Object> object, AnnotationMirror annotation)
	{
		updateObjectFromAnnotationParams(object, annUtils.getAnnotationParams(annotation));
	}

	public void updateObjectFromAnnotationParams(Map<Object, Object> object, HashMap<String, Object> params)
	{
		for (String key : params.keySet()) {
			Object value = params.get(key);
			if (object.containsKey(key)) {
				Object currentValue = object.get(key);
				if (currentValue instanceof List && value instanceof List) {
					List<Object> currentList = (List<Object>) currentValue;
					for (int i = 0; i < currentList.size(); i++) {
						appendUnique(currentList, ((List<Object>) value).get(i));
					}
				} else if (value instanceof Class<?>) {
					object.put(key, ((Class<?>) value).getName());
				} else {
					object.put(key, value);
				}
			} else {
				object.put(key, value);
			}
		}
	}
}

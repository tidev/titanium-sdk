package org.appcelerator.titanium.ant;

import java.io.FileNotFoundException;
import java.io.FileReader;
import java.util.Collection;
import java.util.Iterator;
import java.util.Map;

import org.json.simple.JSONValue;

public class TiAntUtil {

	public static String join(Collection<? extends Object> collection, String joinString) {
		StringBuilder sb = new StringBuilder();
		Iterator<? extends Object> iter = collection.iterator();
		while (iter.hasNext()) {
			sb.append(iter.next());
			if (iter.hasNext()) {
				sb.append(joinString);
			}
		}
		return sb.toString();
	}
	
	@SuppressWarnings("unchecked")
	public static Map<String, Object> getJSONMap(Map<String, Object> parent, String... names) {
		Map<String,Object> child = parent;
		for (String name : names) {
			child = (Map<String, Object>) child.get(name);
		}
		return child;
	}
	
	@SuppressWarnings("unchecked")
	public static Map<String, Object> parseJSON(String path) throws FileNotFoundException {
		return (Map<String, Object>) JSONValue.parse(new FileReader(path));
	}
}

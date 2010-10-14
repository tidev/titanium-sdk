/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.ant;

import java.io.FileNotFoundException;
import java.io.FileReader;
import java.util.Collection;
import java.util.List;
import java.util.Map;

import org.json.simple.JSONValue;

@SuppressWarnings("unchecked")
public class TiModuleDependencies {

	protected Map<String, Object> map;
	
	public TiModuleDependencies(String jsonPath) {
		try {
			map = (Map<String, Object>) JSONValue.parse(new FileReader(jsonPath));
		} catch (FileNotFoundException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}
	
	public Map<String, List<String>> getDependencies() {
		return (Map<String, List<String>>)map.get("dependencies");
	}
	
	public Collection<String> getModules() {
		return getDependencies().keySet();
	}
	
	public List<String> getModuleDependencies(String module) {
		return getDependencies().get(module);
	}
	
	public List<String> getRequiredModules() {
		return (List<String>)map.get("required");
	}
	
	public Map<String, List<String>> getLibraries() {
		return (Map<String, List<String>>)map.get("libraries");
	}
	
	public boolean moduleHasLibraries(String module) {
		return getLibraries().containsKey(module);
	}
	
	public List<String> getModuleLibraries(String module) {
		return getLibraries().get(module);
	}
}

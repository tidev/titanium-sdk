/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.ant;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;

import org.apache.tools.ant.BuildException;
import org.apache.tools.ant.Task;

/**
 * Reads the Titanium/Android dependency JSON map, and sets "property" to a space-separated list of the correct module build order
 * Warning: this doesn't detect circular dependencies.. be careful 
 */
public class GetModuleBuildOrderTask extends Task {

	protected String json;
	protected String property;
	protected HashMap<String, Module> modules = new HashMap<String, Module>();
	
	protected class Module {
		String name;
		int dependedCount = 0;
		ArrayList<String> dependencies = new ArrayList<String>();
		public Module(String name) { this.name = name; }
		public void addDependent() {
			dependedCount++;
			for (String dep : dependencies) {
				modules.get(dep).addDependent();
			}
		}
		
		@Override
		public String toString() {
			return name;
		}
	}
	
	@Override
	public void execute() throws BuildException {
		if (json == null) {
			throw new BuildException("No JSON file specified for " + getTaskName());
		}
		if (property == null) {
			throw new BuildException("No property specified for " + getTaskName());
		}
		modules.clear();
		
		try {
			TiModuleDependencies dependencies = new TiModuleDependencies(json);
			
			for (String moduleName : dependencies.getModules()) {
				Module module = null;
				if (!modules.containsKey(moduleName)) {
					module = new Module(moduleName);
					modules.put(moduleName, module);
				} else {
					module = modules.get(moduleName);
				}
				module.dependencies.addAll(dependencies.getModuleDependencies(moduleName));
			}
			
			for (Module module : modules.values()) {
				for (String dependency : module.dependencies) {
					modules.get(dependency).addDependent();
				}
			}
			ArrayList<Module> buildOrder = new ArrayList<Module>(modules.values());
			Collections.sort(buildOrder, new Comparator<Module>() {
				@Override
				public int compare(Module m1, Module m2) {
					if (m1.dependedCount == m2.dependedCount) {
						return m1.name.compareTo(m2.name);
					}
					return m2.dependedCount-m1.dependedCount;
				}
			});
			
			getProject().setProperty(property, TiAntUtil.join(buildOrder, " "));
		} catch (Exception e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}
	
	public String getProperty() {
		return property;
	}

	public void setProperty(String property) {
		this.property = property;
	}

	public String getJson() {
		return json;
	}

	public void setJson(String json) {
		this.json = json;
	}
}

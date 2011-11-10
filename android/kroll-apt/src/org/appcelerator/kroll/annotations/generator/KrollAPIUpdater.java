/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll.annotations.generator;

import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

import org.json.simple.JSONObject;
import org.json.simple.JSONValue;
import org.json.simple.parser.ParseException;

/**
 * This application reconciles and saves all of the fullAPINames in the generated JSON bindings,
 * as well as generates the modules.json file that is used for detecting module jars during package time
 */
public class KrollAPIUpdater
{
	private static final String Kroll_DEFAULT = "org.appcelerator.kroll.annotations.Kroll.DEFAULT";

	private JSONUtils jsonUtils = new JSONUtils();
	private HashMap<String, Object> apiTree = new HashMap<String, Object>();
	private HashMap<String, HashMap<String, Object>> proxies = new HashMap<String, HashMap<String, Object>>();
	private HashMap<String, HashMap<String, Object>> modules = new HashMap<String, HashMap<String, Object>>();

	protected String getParentModuleClass(Map<String, Object> proxy)
	{
		String creatableInModule = (String) jsonUtils.getStringMap(proxy, "proxyAttrs").get("creatableInModule");
		String parentModule = (String) jsonUtils.getStringMap(proxy, "proxyAttrs").get("parentModule");
		if (creatableInModule != null && !creatableInModule.equals(Kroll_DEFAULT)) {
			return creatableInModule;
		} else if (parentModule != null && !parentModule.equals(Kroll_DEFAULT)) {
			return parentModule;
		}
		return null;
	}

	protected Map<String, Object> findParent(String parentModuleClass)
	{
		for (String jsonPath : proxies.keySet()) {
			Map<String, Object> parent = jsonUtils.getStringMap(proxies.get(jsonPath), parentModuleClass);
			if (parent != null) {
				return parent;
			}
		}
		return null;
	}

	protected String getFullApiName(String jsonPath, Map<String, Object> proxy)
	{
		String fullApiName = (String) jsonUtils.getStringMap(proxy, "proxyAttrs").get("name");
		String parentModuleClass = getParentModuleClass(proxy);
		while (parentModuleClass != null) {
			Map<String, Object> parent = findParent(parentModuleClass);
			String parentName = (String) jsonUtils.getStringMap(parent, "proxyAttrs").get("name");
			fullApiName = parentName + "." + fullApiName;

			parentModuleClass = getParentModuleClass(parent);
		}

		return fullApiName;
	}

	protected void addToApiTree(String jsonPath, String className, Map<String, Object> proxy)
	{
		String fullApiName = getFullApiName(jsonPath, proxy);
		jsonUtils.getMap(proxy, "proxyAttrs").put("fullAPIName", fullApiName);

		Map<String, Object> tree = apiTree;
		String[] apiNames = fullApiName.split("\\.");
		for (String api : apiNames) {
			if (api.equals("Titanium")) {
				continue;
			}

			if (!tree.containsKey(api)) {
				HashMap<String, Object> subTree = new HashMap<String, Object>();
				tree.put(api, subTree);
			}

			tree = jsonUtils.getStringMap(tree, api);
		}
		tree.put("_className", className);
	}

	protected Map<String, Object> getProxyApiTree(Map<Object, Object> proxy)
	{
		String fullApiName = (String) jsonUtils.getMap(proxy, "proxyAttrs").get("fullAPIName");
		Map<String, Object> tree = apiTree;
		String[] apiNames = fullApiName.split("\\.");
		for (String api : apiNames) {
			if (api.equals("Titanium")) {
				continue;
			}
			tree = jsonUtils.getStringMap(tree, api);
		}
		return tree;
	}

	@SuppressWarnings("unchecked")
	protected void loadBindings(String jsonPath)
		throws ParseException, IOException
	{
		Map<String, Object> properties = (Map<String, Object>)
			JSONValue.parseWithException(new FileReader(jsonPath));

		Map<String, Object> proxies = jsonUtils.getStringMap(properties, "proxies");
		Map<String, Object> modules = jsonUtils.getStringMap(properties, "modules");

		HashMap<String, Object> jsonProxies = new HashMap<String, Object>();
		this.proxies.put(jsonPath, jsonProxies);

		HashMap<String, Object> jsonModules = new HashMap<String, Object>();
		this.modules.put(jsonPath, jsonModules);

		jsonProxies.putAll(proxies);
		jsonModules.putAll(modules);
	}

	protected void updateApis()
	{
		// First pass generates the API tree
		for (String jsonPath : proxies.keySet()) {
			Map<String, Object> jsonProxies = proxies.get(jsonPath);

			for (String proxyName : jsonProxies.keySet()) {
				Map<String, Object> proxy = jsonUtils.getStringMap(jsonProxies, proxyName);
				addToApiTree(jsonPath, proxyName, proxy);
			}
		}

		// Second pass updates each json file
		for (String jsonPath : proxies.keySet()) {
			Map<String, Object> data = new HashMap<String, Object>();
			data.put("proxies", proxies.get(jsonPath));
			data.put("modules", modules.get(jsonPath));

			try {
				FileWriter out = new FileWriter(jsonPath);
				JSONObject.writeJSONString(data, out);
				out.close();
			} catch (IOException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
		}
	}

	protected void genModules(String modulesDestDir)
	{
		HashMap<String, Object> modulesJSON = new HashMap<String, Object>();

		for (String jsonPath : proxies.keySet()) {
			Map<String, Object> jsonProxies = proxies.get(jsonPath);
			Map<String, Object> jsonModules = modules.get(jsonPath);
			ArrayList<String> moduleNames = new ArrayList<String>();

			for (String moduleClass : jsonModules.keySet()) {
				if (jsonProxies.containsKey(moduleClass)) {

					Map<String, Object> module = jsonUtils.getStringMap(jsonProxies, moduleClass);
					Map<String, Object> proxyAttrs = jsonUtils.getStringMap(module, "proxyAttrs");
					moduleNames.add(proxyAttrs.get("fullAPIName").toString());
				}
			}

			File jsonFile = new File(jsonPath);
			String name = jsonFile.getName();
			name = name.replace(".json", ".jar");

			if (!name.equals("titanium")) {
				name = "titanium-" + name;
			}

			modulesJSON.put(name, moduleNames);
		}

		File modules = new File(modulesDestDir, "modules.json");

		try {
			FileWriter out = new FileWriter(modules);
			JSONObject.writeJSONString(modulesJSON, out);
			out.close();
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}

	public static void main(String[] args)
		throws Exception
	{
		if (args.length == 0) {
			System.err.println("Usage: KrollAPIUpdater <modulesDestDir>");
			System.exit(1);
		}

		String modulesDestDir = args[0];

		KrollAPIUpdater updater = new KrollAPIUpdater();
		for (int i = 1; i < args.length; i++) {
			updater.loadBindings(args[i]);
		}

		updater.updateApis();
		updater.genModules(modulesDestDir);
	}

}

/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll.annotations.generator;

import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Writer;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

import org.json.simple.JSONObject;
import org.json.simple.JSONValue;
import org.json.simple.parser.ParseException;

import freemarker.template.Configuration;
import freemarker.template.DefaultObjectWrapper;
import freemarker.template.Template;

public class KrollBindingGenerator
{
	private static final String RUNTIME_V8 = "v8";
	private static final String RUNTIME_RHINO = "rhino";
	private static final String Kroll_DEFAULT = "org.appcelerator.kroll.annotations.Kroll.DEFAULT";

	private String runtime, outPath;
	private Configuration fmConfig;
	private Template v8SourceTemplate, v8HeaderTemplate;
	private Template rhinoSourceTemplate, rhinoBindingsTemplate;
	private ArrayList<HashMap<String, String>> rhinoBindings = new ArrayList<HashMap<String, String>>();
	private HashMap<String, Object> apiTree = new HashMap<String, Object>();
	private HashMap<String, Object> proxies = new HashMap<String, Object>();
	private HashMap<String, Object> modules = new HashMap<String, Object>();
	private JSONUtils jsonUtils;

	public KrollBindingGenerator(String runtime, String outPath)
	{
		this.runtime = runtime;
		this.outPath = outPath;
		this.jsonUtils = new JSONUtils();

		initTemplates();
	}

	protected void initTemplates()
	{
		fmConfig = new Configuration();
		fmConfig.setObjectWrapper(new DefaultObjectWrapper());
		fmConfig.setClassForTemplateLoading(getClass(), "");

		try {
			ClassLoader loader = getClass().getClassLoader();
			String templatePackage = "org/appcelerator/kroll/annotations/generator/";

			if (RUNTIME_V8.equals(runtime)) {
				InputStream v8HeaderStream = loader.getResourceAsStream(templatePackage + "ProxyBindingV8.h.fm");
				InputStream v8SourceStream = loader.getResourceAsStream(templatePackage + "ProxyBindingV8.cpp.fm");
	
				v8HeaderTemplate = new Template(
					"ProxyBindingV8.h.fm",
					new InputStreamReader(v8HeaderStream),
					fmConfig);
	
				v8SourceTemplate = new Template(
					"ProxyBindingV8.cpp.fm",
					new InputStreamReader(v8SourceStream),
					fmConfig);

			} else if (RUNTIME_RHINO.equals(runtime)) {
				InputStream rhinoSourceStream = loader.getResourceAsStream(templatePackage + "ProxyBindingRhino.java.fm");
				InputStream rhinoBindingsStream = loader.getResourceAsStream(templatePackage + "KrollGeneratedBindingsRhino.java.fm");

				rhinoSourceTemplate = new Template(
					"ProxyBindingRhino.java.fm",
					new InputStreamReader(rhinoSourceStream),
					fmConfig);

				rhinoBindingsTemplate = new Template(
					"KrollGeneratedBindingsRhino.java.fm",
					new InputStreamReader(rhinoBindingsStream),
					fmConfig);
			}
		} catch (IOException e) {
			e.printStackTrace();
		}
	}

	protected void saveTypeTemplate(Template template, String outFile, Map<Object, Object> root)
	{
		Writer writer = null;
		try {
			File file = new File(outPath, outFile);
			System.out.println("Generating " + file.getAbsolutePath());

			File parent = file.getParentFile();
			if (!parent.exists()) {
				parent.mkdirs();
			}

			writer = new FileWriter(file);
			template.process(root, writer);
		} catch (Exception e) {
			e.printStackTrace();
		} finally {
			if (writer != null) {
				try {
					writer.flush();
					writer.close();
				} catch (IOException e) {
					e.printStackTrace();
				}
			}
		}
		
	}

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

	protected String getFullApiName(Map<String, Object> proxy)
	{
		String fullApiName = (String) jsonUtils.getStringMap(proxy, "proxyAttrs").get("name");
		String parentModuleClass = getParentModuleClass(proxy);
		while (parentModuleClass != null) {
			Map<String, Object> parent = jsonUtils.getStringMap(proxies, parentModuleClass);
			String parentName = (String) jsonUtils.getStringMap(parent, "proxyAttrs").get("name");
			fullApiName = parentName + "." + fullApiName;

			parentModuleClass = getParentModuleClass(parent);
		}

		return fullApiName;
	}

	protected void addToApiTree(String className, Map<String, Object> proxy)
	{
		String fullApiName = getFullApiName(proxy);
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

		this.proxies.putAll(proxies);
		this.modules.putAll(modules);
	}

	protected void generateApiTree()
	{
		// First pass generates the API tree
		for (String proxyName : proxies.keySet()) {
			Map<String, Object> proxy = jsonUtils.getStringMap(proxies, proxyName);
			addToApiTree(proxyName, proxy);
		}
	}

	@SuppressWarnings("unchecked")
	protected void generateBindings()
		throws ParseException, IOException
	{
		for (String proxyName : proxies.keySet()) {
			Map<Object, Object> proxy = jsonUtils.getMap(proxies, proxyName);

			HashMap<Object, Object> root = new HashMap<Object, Object>(proxy);
			root.put("allModules", modules);

			if (RUNTIME_V8.equals(runtime)) {
				String v8ProxyHeader = proxyName + ".h";
				String v8ProxySource = proxyName + ".cpp";
	
				saveTypeTemplate(v8HeaderTemplate, v8ProxyHeader, root);
				saveTypeTemplate(v8SourceTemplate, v8ProxySource, root);

			} else if (RUNTIME_RHINO.equals(runtime)) {
				root.put("apiTree", getProxyApiTree(proxy));

				String rhinoProxySource = proxyName.replace('.', File.separatorChar) + "Prototype.java";
				saveTypeTemplate(rhinoSourceTemplate, rhinoProxySource, root);

				HashMap<String, String> binding = new HashMap<String, String>();
				binding.put("class", proxyName);

				Map<String, Object> proxyAttrs = jsonUtils.getStringMap(proxy, "proxyAttrs"); 
				binding.put("apiName", (String) proxyAttrs.get("name"));
				rhinoBindings.add(binding);
			}
		}
	}

	protected void generateRhinoBindings()
	{
		HashMap<Object, Object> root = new HashMap<Object, Object>();
		root.put("bindings", rhinoBindings);

		saveTypeTemplate(rhinoBindingsTemplate,
			"org/appcelerator/kroll/runtime/rhino/KrollGeneratedBindings.java",
			root);
	}

	public static void main(String[] args)
		throws Exception
	{
		if (args.length < 3) {
			System.err.println("Usage: KrollBindingGenerator <runtime> <outdir> <binding.json> [<binding.json> ...]");
			System.exit(1);
		}

		String runtime = args[0];

		if (!(RUNTIME_V8.equals(runtime) || RUNTIME_RHINO.equals(runtime))) {
			System.err.println("\"runtime\" must be v8 or rhino");
			System.exit(1);
		}

		String outDir = args[1];
		KrollBindingGenerator generator = new KrollBindingGenerator(runtime, outDir);

		// First pass to generate the entire API tree
		for (int i = 2; i < args.length; i++) {
			generator.loadBindings(args[i]);
		}

		generator.generateApiTree();
		generator.generateBindings();

		if (RUNTIME_RHINO.equals(runtime)) {
			generator.generateRhinoBindings();
		}
	}

}

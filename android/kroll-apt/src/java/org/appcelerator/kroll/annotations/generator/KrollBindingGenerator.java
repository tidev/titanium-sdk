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
import java.net.URISyntaxException;
import java.net.URL;
import java.security.CodeSource;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
import java.util.jar.JarFile;
import java.util.zip.ZipEntry;

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

	private String runtime, outPath, moduleId, bindingsClassName;
	private boolean isModule;
	private Configuration fmConfig;
	private Template v8SourceTemplate, v8HeaderTemplate;
	private Template rhinoSourceTemplate, rhinoGeneratedBindingsTemplate, rhinoModuleBindingsTemplate;
	private ArrayList<HashMap<String, String>> rhinoBindings = new ArrayList<HashMap<String, String>>();
	private HashMap<String, Object> apiTree = new HashMap<String, Object>();
	private HashMap<String, Object> proxies = new HashMap<String, Object>();
	private HashMap<String, Object> modules = new HashMap<String, Object>();

	// These maps are used so we can load up Titanium JSON metadata when generating source for 3rd party modules
	private HashMap<String, Object> tiProxies = new HashMap<String, Object>();
	private HashMap<String, Object> tiModules = new HashMap<String, Object>();

	private JSONUtils jsonUtils;

	public KrollBindingGenerator(String runtime, String outPath, boolean isModule, String moduleId, String bindingsClassName)
	{
		this.runtime = runtime;
		this.outPath = outPath;
		this.isModule = isModule;
		this.moduleId = moduleId;
		this.bindingsClassName = bindingsClassName;

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
				InputStream rhinoGeneratedBindingsStream = loader.getResourceAsStream(templatePackage + "KrollGeneratedBindingsRhino.java.fm");
				InputStream rhinoModuleBindingsStream = loader.getResourceAsStream(templatePackage + "KrollModuleBindingsRhino.java.fm");

				rhinoSourceTemplate = new Template(
					"ProxyBindingRhino.java.fm",
					new InputStreamReader(rhinoSourceStream),
					fmConfig);

				rhinoGeneratedBindingsTemplate = new Template(
					"KrollGeneratedBindingsRhino.java.fm",
					new InputStreamReader(rhinoGeneratedBindingsStream),
					fmConfig);

				rhinoModuleBindingsTemplate = new Template(
					"KrollModuleBindingsRhino.java.fm",
					new InputStreamReader(rhinoModuleBindingsStream),
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
		FileReader reader = new FileReader(jsonPath);
		Map<String, Object> properties = (Map<String, Object>)
			JSONValue.parseWithException(reader);
		reader.close();

		Map<String, Object> proxies = jsonUtils.getStringMap(properties, "proxies");
		Map<String, Object> modules = jsonUtils.getStringMap(properties, "modules");

		this.proxies.putAll(proxies);
		this.modules.putAll(modules);
	}

	@SuppressWarnings("unchecked")
	protected void loadTitaniumBindings()
		throws ParseException, IOException, URISyntaxException
	{
		// Load the binding JSON data from the titanium.jar relative to the kroll-apt.jar
		// where this class is defined in the MobileSDK

		// According to JavaDoc, getCodeSource() is the only possible "null" part of this chain
		CodeSource codeSource = getClass().getProtectionDomain().getCodeSource();
		if (codeSource == null) {
			System.err.println("Error: No code source found on the ClassLoader's protection domain");
			System.exit(1);
		}

		URL krollAptJarUrl = codeSource.getLocation();
		String mobileAndroidDir = new File(krollAptJarUrl.toURI()).getParent();

		JarFile titaniumJar = new JarFile(new File(mobileAndroidDir, "titanium.jar"));
		ZipEntry jsonEntry = titaniumJar.getEntry("org/appcelerator/titanium/bindings/titanium.json");
		InputStream jsonStream = titaniumJar.getInputStream(jsonEntry);

		Map<String, Object> properties = (Map<String, Object>)
			JSONValue.parseWithException(new InputStreamReader(jsonStream));
		jsonStream.close();
		titaniumJar.close();

		tiProxies.putAll(jsonUtils.getStringMap(properties, "proxies"));
		tiModules.putAll(jsonUtils.getStringMap(properties, "modules"));
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
			root.put("allProxies", proxies);
			root.put("moduleId", moduleId);

			root.put("tiProxies", tiProxies);
			root.put("tiModules", tiModules);

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

		if (isModule) {
			String path = moduleId.replaceAll(".", "/");
			root.put("packageName", moduleId);
			root.put("className", bindingsClassName);

			saveTypeTemplate(rhinoModuleBindingsTemplate, path + "/" + bindingsClassName + ".java", root);

		} else {
			saveTypeTemplate(rhinoGeneratedBindingsTemplate,
				"org/appcelerator/kroll/runtime/rhino/KrollGeneratedBindings.java",
				root);
		}
	}

	public static void main(String[] args)
		throws Exception
	{
		if (args.length < 6) {
			System.err.println("Usage: KrollBindingGenerator <runtime> <outdir> <isModule> <modulePackage> <moduleClassName> <binding.json> [<binding.json> ...]");
			System.exit(1);
		}

		String runtime = args[0];

		if (!(RUNTIME_V8.equals(runtime) || RUNTIME_RHINO.equals(runtime))) {
			System.err.println("\"runtime\" must be v8 or rhino");
			System.exit(1);
		}

		String outDir = args[1];
		boolean isModule = "true".equalsIgnoreCase(args[2]);
		String packageName = args[3];
		String className = args[4];

		KrollBindingGenerator generator = new KrollBindingGenerator(runtime, outDir, isModule, packageName, className);

		// First pass to generate the entire API tree
		for (int i = 5; i < args.length; i++) {
			generator.loadBindings(args[i]);
		}

		if (isModule) {
			generator.loadTitaniumBindings();
		}

		generator.generateApiTree();
		generator.generateBindings();

		if (RUNTIME_RHINO.equals(runtime)) {
			generator.generateRhinoBindings();
		}
	}

}

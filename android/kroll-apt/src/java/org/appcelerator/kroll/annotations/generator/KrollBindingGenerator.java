/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010-Present by Appcelerator, Inc. All Rights Reserved.
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
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.jar.JarFile;
import java.util.zip.ZipEntry;

import org.json.simple.JSONArray;
import org.json.simple.JSONValue;
import org.json.simple.parser.ParseException;

import freemarker.template.Configuration;
import freemarker.template.DefaultObjectWrapper;
import freemarker.template.Template;

public class KrollBindingGenerator
{
	private static final String Kroll_DEFAULT = "org.appcelerator.kroll.annotations.Kroll.DEFAULT";

	private String outPath, moduleId;
	private Configuration fmConfig;
	private Template v8SourceTemplate, v8HeaderTemplate;
	private HashMap<String, Object> apiTree = new HashMap<String, Object>();
	private HashMap<String, Object> proxies = new HashMap<String, Object>();
	private HashMap<String, Object> modules = new HashMap<String, Object>();

	// These maps are used so we can load up Titanium JSON metadata when generating source for 3rd party modules
	private HashMap<String, Object> tiProxies = new HashMap<String, Object>();
	private HashMap<String, Object> tiModules = new HashMap<String, Object>();

	private JSONUtils jsonUtils;

	public KrollBindingGenerator(String outPath, String moduleId)
	{
		this.outPath = outPath;
		this.moduleId = moduleId;

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

			InputStream v8HeaderStream = loader.getResourceAsStream(templatePackage + "ProxyBindingV8.h.fm");
			InputStream v8SourceStream = loader.getResourceAsStream(templatePackage + "ProxyBindingV8.cpp.fm");

			v8HeaderTemplate = new Template("ProxyBindingV8.h.fm", new InputStreamReader(v8HeaderStream), fmConfig);

			v8SourceTemplate = new Template("ProxyBindingV8.cpp.fm", new InputStreamReader(v8SourceStream), fmConfig);

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
	private void mergeModules(Map<String, Object> source)
	{
		Set<String> newKeys = source.keySet();
		for (String key : newKeys) {
			Object newEntry = source.get(key);
			if (!modules.containsKey(key)) {
				modules.put(key, newEntry);
			} else {
				Object origEntry = modules.get(key);
				if (!(origEntry instanceof Map) || !(newEntry instanceof Map)) {
					// That would be odd indeed.
					continue;
				}

				Map<Object, Object> newEntryMap = (Map<Object, Object>) newEntry;
				Map<Object, Object> origEntryMap = (Map<Object, Object>) origEntry;

				if (newEntryMap.containsKey("apiName") && !origEntryMap.containsKey("apiName")) {
					origEntryMap.put("apiName", newEntryMap.get("apiName"));
				}

				String[] listNames = { "childModules", "createProxies" };
				for (String listName : listNames) {
					if (newEntryMap.containsKey(listName)) {
						JSONArray list = (JSONArray) newEntryMap.get(listName);
						for (int i = 0; i < list.size(); i++) {
							jsonUtils.appendUniqueObject(origEntryMap, listName, "id",
														 (Map<Object, Object>) list.get(i));
						}
					}
				}
			}
		}
	}

	@SuppressWarnings("unchecked")
	protected void loadBindings(String jsonPath) throws ParseException, IOException
	{
		FileReader reader = new FileReader(jsonPath);
		Map<String, Object> properties = (Map<String, Object>) JSONValue.parseWithException(reader);
		reader.close();

		Map<String, Object> proxies = jsonUtils.getStringMap(properties, "proxies");
		Map<String, Object> modules = jsonUtils.getStringMap(properties, "modules");

		this.proxies.putAll(proxies);
		mergeModules(modules);
	}

	@SuppressWarnings("unchecked")
	protected void loadTitaniumBindings() throws ParseException, IOException, URISyntaxException
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

		Map<String, Object> properties =
			(Map<String, Object>) JSONValue.parseWithException(new InputStreamReader(jsonStream));
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

	protected void generateBindings() throws ParseException, IOException
	{
		for (String proxyName : proxies.keySet()) {
			Map<Object, Object> proxy = jsonUtils.getMap(proxies, proxyName);

			HashMap<Object, Object> root = new HashMap<Object, Object>(proxy);
			root.put("allModules", modules);
			root.put("allProxies", proxies);
			root.put("moduleId", moduleId);

			root.put("tiProxies", tiProxies);
			root.put("tiModules", tiModules);

			String v8ProxyHeader = proxyName + ".h";
			String v8ProxySource = proxyName + ".cpp";

			saveTypeTemplate(v8HeaderTemplate, v8ProxyHeader, root);
			validateProxyShape(root);
			saveTypeTemplate(v8SourceTemplate, v8ProxySource, root);
		}
	}

	private void validateProxyShape(Map<Object, Object> root)
	{
		Map<String, Object> proxyAttrs = (Map<String, Object>) root.get("proxyAttrs");
		List<String> propertyAccessors = (List<String>) proxyAttrs.get("propertyAccessors");
		if (propertyAccessors == null) {
			propertyAccessors = Collections.EMPTY_LIST;
		}
		Map<String, Object> methods = (Map<String, Object>) root.get("methods");
		if (methods == null) {
			methods = Collections.EMPTY_MAP;
		}
		Map<String, Object> dynamicProperties = (Map<String, Object>) root.get("dynamicProperties");
		if (dynamicProperties == null) {
			dynamicProperties = Collections.EMPTY_MAP;
		}
		if (methods.size() > 0 || dynamicProperties.size() > 0) {
			String proxyClassName = (String) root.get("proxyClassName");
			for (String propertyName : propertyAccessors) {

				// if a property is defined as both dynamic *and* accessor, then developer needs to choose.
				// If there's both a set and getProperty, just remove the property accessor
				// if there's no setProperty impl, then need to add one and remove from propertyAccessors
				if (dynamicProperties.containsKey(propertyName)) {
					System.out.println(
						"[WARN] Clashing property definition in proxy.propertyAccessors and a @Kroll.set/getProperty annotations for property '"
						+ proxyClassName + "." + propertyName + "'.");
					Map<String, Object> dynamicProperty = (Map<String, Object>) dynamicProperties.get(propertyName);
					if ((Boolean) dynamicProperty.get("set")) { // there's a setter
						// is getter defined?
						if ((Boolean) dynamicProperty.get("get")) {
							System.err.println(
								"Likely fix is to remove from proxy.propertyAccessors listing, as both getter and setter methods are defined.");
						} else {
							System.err.println(
								"Likely fix is to remove from proxy.propertyAccessors listing, as a setter method is already defined. A getter IS NOT defined, so you may want to add a @Kroll.getProperty implementation as well (or rely n the default getter generated, which uses #onPropertyChanged() to react).");
						}
						System.exit(1);
					} else {
						// NO SETTER! (must have getter)
						// This may be a valid usage pattern: override getProperty, wants the "default" set implementation
						System.out.println(
							"[WARN] This will use the 'default' implementation for a setter and treat the property as readwrite, with a non-default getter.");
						System.out.println(
							"[WARN] This is not an error, but you may want to consider adding a @Kroll.setProperty implementation and then removing from proxy.propertyAccessors listing.");
					}
					// Don't check for clashing methods, since we handle that for dynamic properties in next loop (and we have a dynamic property with same name)
					continue;
				}

				// If there's a method matching auto-generated property accessor, then dev needs to either:
				// - rename the method
				// - remove property accessor and ensure the method is marked with @Kroll.get/setProperty annotation (basically go from "JS" property to "dynamic" property)
				String upperProp = Character.toUpperCase(propertyName.charAt(0)) + propertyName.substring(1);
				boolean hasClashingGetter = methods.containsKey("get" + upperProp);
				boolean hasClashingSetter = methods.containsKey("set" + upperProp);
				if (hasClashingGetter && hasClashingSetter) {
					System.err.println(
						"Clashing method definitions in proxy.propertyAccessors and @Kroll.method annotations for property accessors on '"
						+ proxyClassName + "." + propertyName + " - get" + upperProp + "() and set" + upperProp
						+ "()'.");
					System.err.println(
						"Likely fix is to remove from proxy.propertyAccessors listing, remove @Kroll.method annotation and add @Kroll.getProperty/@Kroll.setProperty annotations to the methods.");
					System.err.println("Alternately, please rename the methods to avoid the clash.");
					System.exit(1);
				}
				if (hasClashingGetter) {
					// There's a getter due to propertyAccessor entry, but also a method with same name
					System.err.println(
						"Clashing method definition in proxy.propertyAccessors and a @Kroll.method annotation for property accessor '"
						+ proxyClassName + "#get" + upperProp + "()'.");
					System.err.println(
						"Likely fix is to remove @Kroll.method annotation and add @Kroll.getProperty annotation to method.");
					System.err.println("Alternately, please rename the method to avoid the clash.");
					System.exit(1);
				}
				if (hasClashingSetter) {
					// There's a setter due to propertyAccessor entry, but also a method with same name
					System.err.println(
						"Clashing method definition in proxy.propertyAccessors and a @Kroll.method annotation for property accessor '"
						+ proxyClassName + "#set" + upperProp + "()'.");
					System.err.println(
						"Likely fix is to remove @Kroll.method annotation and add @Kroll.setProperty annotation to method.");
					System.err.println("Alternately, please rename the method to avoid the clash.");
					System.exit(1);
				}
			}

			for (String propertyName : dynamicProperties.keySet()) {
				Map<String, Object> dynamicProperty = (Map<String, Object>) dynamicProperties.get(propertyName);
				String getterName = (String) dynamicProperty.get("getMethodName");
				boolean hasGetter = true;
				if (getterName == null) {
					hasGetter = false;
					getterName = "get" + Character.toUpperCase(propertyName.charAt(0)) + propertyName.substring(1);
				}

				// Turns out implying @Kroll.method from @Kroll.getProperty/setProperty is a pain in the ass (as they have properties that can change their names)!
				// so let's warn when they're not paired up

				// method has @Kroll.getProperty but no @Kroll.method. This is ok in some cases, but generally we want getter accessors until they get removed in SDK 9
				if (hasGetter && !methods.containsKey(getterName)) {
					// There are rare cases where we don't want this, like Ti.Android.R (I assume we don't want Ti.Android#getR())
					System.out.println(
						"[WARN] Property has getter defined with @Kroll.getProperty on " + proxyClassName + "#"
						+ getterName
						+ "(), but has no @Kroll.method annotation. Consider adding one to expose the getter accessor to JS.");
				}

				// there's no getProperty defined, but there's a method with the target name
				if (!hasGetter && methods.containsKey(getterName)) {
					System.err.println("There is no getter assigned to property " + propertyName
									   + ", but there is a @Kroll.method annotation on the default getter method name: "
									   + proxyClassName + "#" + getterName + "()");
					System.err.println("Likely fix is to add the @Kroll.getProperty to this method so that obj."
									   + propertyName + " returns the same value as obj." + getterName + "();");
					System.err.println("Alternately, please rename the method to avoid the clash.");
					System.exit(1);
				}

				String setterName = (String) dynamicProperty.get("setMethodName");
				boolean hasSetter = true;
				if (setterName == null) {
					hasSetter = false;
					setterName = "set" + Character.toUpperCase(propertyName.charAt(0)) + propertyName.substring(1);
				}

				if (hasSetter && !methods.containsKey(setterName)) {
					// method has @Kroll.setProperty but no @Kroll.method. This is ok in some cases, but generally we want setter accessors unitl they get removed in SDK 9
					System.out.println(
						"[WARN] Property has setter defined with @Kroll.getProperty on " + proxyClassName + "#"
						+ setterName
						+ "(), but has no @Kroll.method annotation. Consider adding one to expose the setter accessor to JS.");
				}

				// there's no setProperty defined, but there's a method with the target name
				if (!hasSetter && methods.containsKey(setterName)) {
					// ensure target method has typical single argument, if not then we can't expose as property setter
					Map<String, Object> method = (Map<String, Object>) methods.get(setterName);
					List<Map> args = (List<Map>) method.get("args");
					if (args.size() == 1) {
						System.err.println(
							"There is no setter assigned to property " + propertyName
							+ ", but there is a @Kroll.method annotation on the default setter method name: "
							+ proxyClassName + "#" + setterName + "()");
						System.err.println("Likely fix is to add the @Kroll.setProperty to this method so that obj."
										   + propertyName + " = value executes the same code as obj." + setterName
										   + "(value);");
						System.err.println("Alternately, please rename the method to avoid the clash.");
						System.exit(1);
					}
				}
			}
		}
	}

	public static void main(String[] args) throws Exception
	{
		if (args.length < 4) {
			System.err.println(
				"Usage: KrollBindingGenerator <outdir> <isModule> <modulePackage> <binding.json> [<binding.json> ...]");
			System.exit(1);
		}

		String outDir = args[0];
		boolean isModule = "true".equalsIgnoreCase(args[1]);
		String packageName = args[2];

		KrollBindingGenerator generator = new KrollBindingGenerator(outDir, packageName);

		// First pass to generate the entire API tree
		for (int i = 3; i < args.length; i++) {
			generator.loadBindings(args[i]);
		}

		if (isModule) {
			generator.loadTitaniumBindings();
		}

		generator.generateApiTree();
		generator.generateBindings();
	}
}

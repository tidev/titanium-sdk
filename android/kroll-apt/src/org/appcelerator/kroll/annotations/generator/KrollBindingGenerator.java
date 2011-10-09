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
import java.util.HashMap;
import java.util.Map;

import org.json.simple.JSONValue;
import org.json.simple.parser.ParseException;

import freemarker.template.Configuration;
import freemarker.template.DefaultObjectWrapper;
import freemarker.template.Template;

public class KrollBindingGenerator
{
	private String outPath;
	private Configuration fmConfig;
	private Template sourceTemplate, headerTemplate;

	@SuppressWarnings("unchecked")
	public KrollBindingGenerator(String outPath)
	{
		this.outPath = outPath;
		initTemplate();
	}

	protected void initTemplate()
	{
		fmConfig = new Configuration();
		fmConfig.setObjectWrapper(new DefaultObjectWrapper());
		fmConfig.setClassForTemplateLoading(getClass(), "");

		try {
			InputStream headerStream, sourceStream;
			ClassLoader loader = getClass().getClassLoader();
			headerStream = loader.getResourceAsStream("org/appcelerator/kroll/annotations/generator/ProxyBindingV8.h.fm");
			sourceStream = loader.getResourceAsStream("org/appcelerator/kroll/annotations/generator/ProxyBindingV8.cpp.fm");
	
			headerTemplate = new Template(
				"ProxyBindingV8.h.fm",
				new InputStreamReader(headerStream),
				fmConfig);
			sourceTemplate = new Template(
				"ProxyBindingV8.cpp.fm",
				new InputStreamReader(sourceStream),
				fmConfig);
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

	@SuppressWarnings("unchecked")
	protected void generateBindings(String jsonPath)
		throws ParseException, IOException
	{
		Map<String, Object> properties = (Map<String, Object>)
			JSONValue.parseWithException(new FileReader(jsonPath));

		Map<String, Object> proxies = (Map<String, Object>) properties.get("proxies");
		for (String proxyName : proxies.keySet()) {
			Map<Object, Object> proxy = (Map<Object, Object>)proxies.get(proxyName);
			HashMap<Object, Object> root = new HashMap<Object, Object>(proxy);
			root.put("allModules", properties.get("modules"));

			String proxyHeader = proxyName + ".h";
			String proxySource = proxyName + ".cpp";
			
			saveTypeTemplate(headerTemplate, proxyHeader, root);
			saveTypeTemplate(sourceTemplate, proxySource, root);
		}
	}

	public static void main(String[] args)
		throws Exception
	{
		if (args.length < 2) {
			System.err.println("Usage: KrollBindingGenerator <outdir> <binding.json> [<binding.json> ...]");
			System.exit(1);
		}

		String outDir = args[0];
		KrollBindingGenerator generator = new KrollBindingGenerator(outDir);

		for (int i = 1; i < args.length; i++) {
			generator.generateBindings(args[i]);
		}
	}

}

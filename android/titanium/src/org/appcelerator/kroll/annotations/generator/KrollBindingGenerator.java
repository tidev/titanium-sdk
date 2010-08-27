/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll.annotations.generator;

import java.io.IOException;
import java.io.InputStreamReader;
import java.io.Writer;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Set;

import javax.annotation.processing.AbstractProcessor;
import javax.annotation.processing.RoundEnvironment;
import javax.annotation.processing.SupportedAnnotationTypes;
import javax.annotation.processing.SupportedSourceVersion;
import javax.lang.model.SourceVersion;
import javax.lang.model.element.AnnotationMirror;
import javax.lang.model.element.Element;
import javax.lang.model.element.ExecutableElement;
import javax.lang.model.element.TypeElement;
import javax.lang.model.element.VariableElement;
import javax.lang.model.util.SimpleElementVisitor6;
import javax.tools.FileObject;
import javax.tools.JavaFileObject;
import javax.tools.StandardLocation;

import org.appcelerator.kroll.KrollConverter;
import org.appcelerator.kroll.KrollInvocation;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.util.KrollAnnotationUtils;
import org.appcelerator.kroll.util.KrollVisitor;
import org.json.JSONObject;

import freemarker.template.Configuration;
import freemarker.template.DefaultObjectWrapper;
import freemarker.template.Template;
import freemarker.template.TemplateException;

@SupportedAnnotationTypes({
	"org.appcelerator.kroll.annotations.Kroll.proxy",
	"org.appcelerator.kroll.annotations.Kroll.module"})
@SupportedSourceVersion(SourceVersion.RELEASE_6)
public class KrollBindingGenerator extends AbstractProcessor {

	protected Template bindingTemplate, appBootTemplate;
	protected HashMap<String, Object> proxyBindings = new HashMap<String, Object>();
	protected HashMap<String, Object> bindingProperties = new HashMap<String, Object>();
	protected ArrayList<String> proxies = new ArrayList<String>();
	protected HashMap<String, Object> modules = new HashMap<String, Object>();
	protected Configuration fmConfig;
	protected KrollAnnotationUtils utils;
	
	public KrollBindingGenerator() {
		super();
		fmConfig = new Configuration();
		fmConfig.setObjectWrapper(new DefaultObjectWrapper());

		try {
			bindingTemplate = new Template("ProxyBinding.fm", new InputStreamReader(
				getClass().getClassLoader().getResourceAsStream(
					"org/appcelerator/kroll/annotations/generator/ProxyBinding.fm")),
					fmConfig);
			appBootTemplate = new Template("AppBoot.fm", new InputStreamReader(
				getClass().getClassLoader().getResourceAsStream(
					"org/appcelerator/kroll/annotations/generator/AppBoot.fm")),
					fmConfig);
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}
	
	@Override
	public boolean process(Set<? extends TypeElement> annotations,
			RoundEnvironment roundEnv) {
		
		utils = new KrollAnnotationUtils(processingEnv);
		
		if (!roundEnv.processingOver()) {
			for (Element element : roundEnv.getRootElements()) {
				generateKrollProxy(element);
			}
			
		} else {
			//generateAppBoot();
			writeJSON();
		}
		
		return true;
	}
	
	protected void generateKrollProxy(final Element element) {
		utils.acceptAnnotations(element, new Class<?>[] { Kroll.proxy.class, Kroll.module.class }, new KrollVisitor<AnnotationMirror>(){
			@Override
			public boolean visit(AnnotationMirror annotation, Object arg) {
				utils.debugLog("visiting proxies/modules");
				bindingProperties.clear();
				
				String packageName = utils.getPackage(element);
				String proxyClassName = utils.getName(element);
				String genClassName = proxyClassName + "_Binding";
				String sourceName = String.format("%s.%s", packageName, genClassName);
				
				bindingProperties.put("packageName", packageName);
				bindingProperties.put("proxyClassName", proxyClassName);
				bindingProperties.put("genClassName", genClassName);
				bindingProperties.put("sourceName", sourceName);
				bindingProperties.put("element", element);
				bindingProperties.put("proxyAnnotation", annotation);
				bindingProperties.put("methods", new HashMap<String, HashMap<String, Object>>());
				bindingProperties.put("constants", new HashMap<String, HashMap<String, Object>>());
				bindingProperties.put("properties", new HashMap<String, HashMap<String, Object>>());
				bindingProperties.put("dynamicProperties", new HashMap<String, HashMap<String, Object>>());
				
				proxies.add(packageName+"."+proxyClassName);
				
				if (utils.annotationTypeIs(annotation, Kroll.module.class)) {
					String moduleName = proxyClassName.substring(0, proxyClassName.indexOf("Module"));
					modules.put(moduleName, packageName+"."+proxyClassName);
				}
				
				BindingVisitor visitor = new BindingVisitor();
				for (Element e : element.getEnclosedElements()) {
					e.accept(visitor, null);
				}
				
				saveTypeTemplate(bindingTemplate, sourceName, bindingProperties);
				proxyBindings.put(packageName+"."+proxyClassName, bindingProperties.clone());
				
				return true;
			}
		});
	}
	
	protected class BindingVisitor extends SimpleElementVisitor6<Object, Object> implements KrollVisitor<AnnotationMirror>
	{	
		@Override
		public String visitExecutable(ExecutableElement e, Object p) {
			utils.acceptAnnotations(e, new Class<?>[] {
				Kroll.method.class, Kroll.createMethod.class, Kroll.getProperty.class, Kroll.setProperty.class
			}, this, e);
			return null;
		}
		
		@Override
		public Object visitVariable(VariableElement e, Object p) {
			utils.acceptAnnotations(e, new Class<?>[] { Kroll.property.class, Kroll.constant.class }, this, e);
			return null;
		}
		
		public boolean visit(AnnotationMirror annotation, Object arg) {
			if (arg instanceof ExecutableElement) {
				ExecutableElement element = (ExecutableElement)arg;
				if (utils.annotationTypeIsOneOf(annotation, new Class<?>[]{
					Kroll.getProperty.class, Kroll.setProperty.class})) {
					
					visitDynamicProperty(annotation, element);
				} else {
					visitMethod(annotation, element);
				}
			} else if (arg instanceof VariableElement) {
				VariableElement element = (VariableElement)arg;
				visitProperty(annotation, element);
			}
			return true;
		}
		
		@SuppressWarnings("unchecked")
		protected HashMap<String, HashMap<String, Object>> getBindingMap(String name) {
			return (HashMap<String, HashMap<String, Object>>) bindingProperties.get(name);
		}
		
		protected void visitMethod(AnnotationMirror annotation, ExecutableElement element) {
			HashMap<String, HashMap<String, Object>> methods = getBindingMap("methods");
			ArrayList<HashMap<String, Object>> args = new ArrayList<HashMap<String, Object>>();
			
			for (VariableElement var: element.getParameters()) {
				String paramType = utils.getType(var);
				if (utils.typeIs(paramType, KrollInvocation.class)) {
					continue;
				}
				
				String paramName = utils.getName(var);
				
				HashMap<String, Object> argParams = new HashMap<String, Object>();
				argParams.put("name", paramName);
				argParams.put("type", paramType);
				argParams.put("converter", KrollConverter.class);
				argParams.put("defaultValueProvider", KrollConverter.class);
				argParams.putAll(utils.getAnnotationParams(var, Kroll.argument.class));
				args.add(argParams);
			}
			
			HashMap<String, Object> attrs = utils.getAnnotationParams(annotation);
			attrs.put("annotation", annotation);
			attrs.put("args", args);
			attrs.put("returnType", element.getReturnType().toString());
			attrs.put("converter", KrollConverter.class);
			
			methods.put(element.getSimpleName().toString(), attrs);
		}
		
		protected void visitProperty(AnnotationMirror annotation, VariableElement element) {
			boolean isConstant = utils.annotationTypeIs(annotation, Kroll.constant.class);
			
			HashMap<String, HashMap<String, Object>> propertyMap = getBindingMap(isConstant ? "constants" : "properties");
			HashMap<String, Object> property = utils.getAnnotationParams(annotation);
			
			String type = utils.getType(element);
			property.put("type", type);
			String defaultName = utils.getName(element);
			property.put("proxyName", defaultName);
			
			String name = (String)property.get("name");
			if (name.equals(KrollConverter.DEFAULT_NAME)) {
				property.put("name", defaultName);
				name = defaultName;
			}
			
			if (isConstant) {
				utils.debugLog("constant => " + name);
			}
			propertyMap.put(name, property);
		}
		
		protected void visitDynamicProperty(AnnotationMirror annotation, ExecutableElement element) {
			HashMap<String, HashMap<String, Object>> dynamicProperties = getBindingMap("dynamicProperties");
			HashMap<String, Object> dynamicProperty = utils.getAnnotationParams(annotation);
			
			String methodName = utils.getName(element);
			String defaultName = new String(methodName);
			if (defaultName.startsWith("get") || defaultName.startsWith("set")) {
				defaultName = Character.toLowerCase(defaultName.charAt(3)) + defaultName.substring(4);
			} else if (defaultName.startsWith("is")) {
				defaultName = Character.toLowerCase(defaultName.charAt(2)) + defaultName.substring(3);
			}
			
			String name = (String)dynamicProperty.get("name");
			if (name.equals(KrollConverter.DEFAULT_NAME)) {
				dynamicProperty.put("name", defaultName);
				name = defaultName;
			}
			
			if (dynamicProperties.containsKey(name)) {
				dynamicProperty = dynamicProperties.get(name);
			} else {
				// setup defaults
				dynamicProperty.put("get", false);
				dynamicProperty.put("set", false);
			}
			
			if (utils.annotationTypeIs(annotation, Kroll.getProperty.class)) {
				utils.debugLog("property="+name+",getMethodName="+methodName);
				dynamicProperty.put("get", true);
				dynamicProperty.put("getMethodName", methodName);
			} else {
				utils.debugLog("property="+name+",setMethodName="+methodName);
				dynamicProperty.put("set", true);
				dynamicProperty.put("setMethodName", methodName);
			}
			
			dynamicProperties.put(name, dynamicProperty);
		}
	}
	
	protected void generateAppBoot() {
		HashMap<String,Object> root = new HashMap<String,Object>();
		//todo, this should come from the environment
		String appName = "Test";
		String appPackage = "com.appcelerator.kroll.test";
		
		root.put("proxies", proxies);
		root.put("modules", modules);
		root.put("appName", appName);
		root.put("appPackage", appPackage);
		
		saveTypeTemplate(appBootTemplate, appPackage+"."+appName+"Boot", root);
	}
	
	protected void saveTypeTemplate(Template template, String type, HashMap<String, Object> root) {
		Writer writer = null;
		try {
			JavaFileObject jfo = processingEnv.getFiler().createSourceFile(type);
			writer = jfo.openWriter();
			template.process(root, writer);
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} catch (TemplateException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} finally {
			if (writer != null) {
				try {
					writer.flush();
					writer.close();
				} catch (IOException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
				}
			}
		}
		
	}
	
	protected void writeJSON() {
		try {
			JSONObject o = new JSONObject(proxyBindings);
			FileObject file = processingEnv.getFiler().createResource(
				StandardLocation.CLASS_OUTPUT, "org.appcelerator.titanium.gen", "bindings.json");
			Writer writer = file.openWriter();
			
			writer.write(o.toString().toCharArray());
			writer.close();
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}
}

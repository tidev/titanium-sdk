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
import java.util.List;
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
import javax.lang.model.util.Types;
import javax.tools.FileObject;
import javax.tools.JavaFileObject;
import javax.tools.StandardLocation;
import javax.tools.Diagnostic.Kind;

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

	protected static final String Kroll_annotation = "org.appcelerator.kroll.annotations.Kroll";
	
	protected static final String Kroll_argument = Kroll_annotation + ".argument";
	protected static final String Kroll_constant = Kroll_annotation + ".constant";
	protected static final String Kroll_createMethod = Kroll_annotation + ".createMethod";
	protected static final String Kroll_getProperty = Kroll_annotation + ".getProperty";
	protected static final String Kroll_inject = Kroll_annotation + ".inject";
	protected static final String Kroll_inject_DEFAULT = Kroll_annotation + ".inject.DEFAULT";
	protected static final String Kroll_method = Kroll_annotation + ".method";
	protected static final String Kroll_module = Kroll_annotation + ".module";
	protected static final String Kroll_property = Kroll_annotation + ".property";
	protected static final String Kroll_proxy = Kroll_annotation + ".proxy";
	protected static final String Kroll_setProperty = Kroll_annotation + ".setProperty";
	
	protected static final String KrollInvocation = "org.appcelerator.kroll.KrollInvocation";
	protected static final String KrollConverter = "org.appcelerator.kroll.KrollConverter";
	
	// this needs to mirror Kroll.DEFAULT_NAME
	protected static final String DEFAULT_NAME = "__default_name__";
	
	protected Template bindingTemplate, appBootTemplate;
	protected HashMap<String, Object> proxyBindings = new HashMap<String, Object>();
	protected HashMap<String, Object> bindingProperties = new HashMap<String, Object>();
	protected ArrayList<String> proxies = new ArrayList<String>();
	protected HashMap<String, Object> modules = new HashMap<String, Object>();
	protected HashMap<String, Object> createProxies = new HashMap<String, Object>();
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
			//writeJSON();
		}
		
		return true;
	}
	
	protected void generateKrollProxy(final Element element) {
		utils.acceptAnnotations(element, new String[] { Kroll_proxy, Kroll_module }, new KrollVisitor<AnnotationMirror>(){
			@Override
			public boolean visit(AnnotationMirror annotation, Object arg) {
				utils.debugLog("visiting proxies/modules");
				bindingProperties.clear();
				
				String packageName = utils.getPackage(element);
				String proxyClassName = utils.getName(element);
				String genClassName = proxyClassName + "BindingGen";
				String sourceName = String.format("%s.%s", packageName, genClassName);
				String apiName = proxyClassName;
				int moduleIdx, proxyIdx;
				if ((proxyIdx = proxyClassName.indexOf("Proxy")) != -1) {
					apiName = proxyClassName.substring(0, proxyIdx);
				} else if ((moduleIdx = proxyClassName.indexOf("Module")) != -1) {
					apiName = proxyClassName.substring(0, moduleIdx);
				}
				
				HashMap<String, Object> proxyAttrs = utils.getAnnotationParams(annotation);
				if (proxyAttrs.get("name").equals(DEFAULT_NAME)) {
					proxyAttrs.put("name", apiName);
				} else {
					apiName = (String)proxyAttrs.get("name");
				}
				
				if (proxyAttrs.containsKey("creatableInModule")) {
					String createInModule = (String) proxyAttrs.get("creatableInModule");
					if (!createInModule.equals(DEFAULT_NAME)) {
						ArrayList<Object> createProxyList = (ArrayList<Object>) createProxies.get(createInModule);
						if (createProxyList == null) {
							createProxyList = new ArrayList<Object>();
							createProxies.put(createInModule, createProxyList);
						}
						
						proxyAttrs.put("proxyClassName", String.format("%s.%s", packageName, proxyClassName));
						createProxyList.add(proxyAttrs);
					}
				}
				
				TypeElement type = (TypeElement) element;
				Element superType = processingEnv.getTypeUtils().asElement(type.getSuperclass());
				
				String superTypeName = utils.getName(superType);
				if (!superTypeName.equals("Object")) {
					bindingProperties.put("superProxyBindingClassName", String.format("%s.%sBindingGen", utils.getPackage(superType), superTypeName));
				}
				
				bindingProperties.put("packageName", packageName);
				bindingProperties.put("proxyClassName", proxyClassName);
				bindingProperties.put("genClassName", genClassName);
				bindingProperties.put("sourceName", sourceName);
				bindingProperties.put("element", element);
				bindingProperties.put("proxyAnnotation", annotation);
				bindingProperties.put("proxyAttrs", proxyAttrs);
				bindingProperties.put("createProxies", createProxies);
				bindingProperties.put("methods", new HashMap<String, HashMap<String, Object>>());
				bindingProperties.put("constants", new HashMap<String, HashMap<String, Object>>());
				bindingProperties.put("properties", new HashMap<String, HashMap<String, Object>>());
				bindingProperties.put("dynamicProperties", new HashMap<String, HashMap<String, Object>>());
				bindingProperties.put("injectFields", new ArrayList<HashMap<String, Object>>());
				bindingProperties.put("injectMethods", new ArrayList<HashMap<String, Object>>());
				
				proxies.add(packageName+"."+proxyClassName);
				
				if (utils.annotationTypeIs(annotation, Kroll_module)) {
					modules.put(apiName, packageName+"."+proxyClassName);
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
			utils.acceptAnnotations(e, new String[] {
				Kroll_method, Kroll_createMethod, Kroll_getProperty, Kroll_setProperty, Kroll_inject
			}, this, e);
			return null;
		}
		
		@Override
		public Object visitVariable(VariableElement e, Object p) {
			utils.acceptAnnotations(e, new String[] { Kroll_property, Kroll_constant, Kroll_inject }, this, e);
			return null;
		}
		
		public boolean visit(AnnotationMirror annotation, Object arg) {
			if (arg instanceof ExecutableElement) {
				ExecutableElement element = (ExecutableElement)arg;
				if (utils.annotationTypeIsOneOf(annotation, new String[]{
					Kroll_getProperty, Kroll_setProperty})) {
					
					visitDynamicProperty(annotation, element);
				} else if (utils.annotationTypeIs(annotation, Kroll_inject)) {
					visitInject(annotation, element, true);
				} else {
					visitMethod(annotation, element);
				}
			} else if (arg instanceof VariableElement) {
				VariableElement element = (VariableElement)arg;
				if (utils.annotationTypeIs(annotation, Kroll_inject)) {
					visitInject(annotation, element, false);
				} else {
					visitProperty(annotation, element);
				}
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
			HashMap<String, Object> attrs = utils.getAnnotationParams(annotation);
			attrs.put("hasInvocation", false);
			
			for (VariableElement var: element.getParameters()) {
				String paramType = utils.getType(var);
				if (paramType.equals(KrollInvocation)) {
					attrs.put("hasInvocation", true);
					continue;
				}
				
				String paramName = utils.getName(var);
				
				HashMap<String, Object> argParams = new HashMap<String, Object>();
				argParams.put("sourceName", paramName);
				argParams.put("type", paramType);
				argParams.putAll(utils.getAnnotationParams(var, Kroll_argument));
				String name = (String) argParams.get("name");
				if (name == null || name.equals(DEFAULT_NAME)) {
					argParams.put("name", paramName);
				}
				
				if (!argParams.containsKey("converter")) {
					argParams.put("converter", KrollConverter);
				}
				if (!argParams.containsKey("defaultValueProvider")) {
					argParams.put("defaultValueProvider", KrollConverter);
				}
				args.add(argParams);
			}
			
			attrs.put("annotation", annotation);
			attrs.put("args", args);
			attrs.put("returnType", element.getReturnType().toString());
			
			utils.debugLog("method converter for " + utils.getName(element) + " => " + attrs.get("converter"));
			//attrs.put("converter", KrollConverter.class);
			
			methods.put(element.getSimpleName().toString(), attrs);
		}
		
		protected void visitProperty(AnnotationMirror annotation, VariableElement element) {
			boolean isConstant = utils.annotationTypeIs(annotation, Kroll_constant);
			
			HashMap<String, HashMap<String, Object>> propertyMap = getBindingMap(isConstant ? "constants" : "properties");
			HashMap<String, Object> property = utils.getAnnotationParams(annotation);
			
			String type = utils.getType(element);
			property.put("type", type);
			String defaultName = utils.getName(element);
			property.put("proxyName", defaultName);
			
			String name = (String)property.get("name");
			if (name.equals(DEFAULT_NAME)) {
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
			HashMap<String, Object> params = utils.getAnnotationParams(annotation);
			HashMap<String, Object> dynamicProperty = params;
			
			String methodName = utils.getName(element);
			String defaultName = new String(methodName);
			if (defaultName.startsWith("get") || defaultName.startsWith("set")) {
				defaultName = Character.toLowerCase(defaultName.charAt(3)) + defaultName.substring(4);
			} else if (defaultName.startsWith("is")) {
				defaultName = Character.toLowerCase(defaultName.charAt(2)) + defaultName.substring(3);
			}
			
			String name = (String)dynamicProperty.get("name");
			if (name.equals(DEFAULT_NAME)) {
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
			
			if (utils.annotationTypeIs(annotation, Kroll_getProperty)) {
				dynamicProperty.put("get", true);
				dynamicProperty.put("getMethodName", methodName);
			} else {
				dynamicProperty.put("set", true);
				dynamicProperty.put("setMethodName", methodName);
				dynamicProperty.put("retain", params.get("retain"));
			}
			
			dynamicProperties.put(name, dynamicProperty);
		}
		
		protected void visitInject(AnnotationMirror annotation, Element element, boolean isMethod) {
			ArrayList<HashMap<String, Object>> injectList =
				(ArrayList<HashMap<String, Object>>) bindingProperties.get(isMethod ? "injectMethods" : "injectFields");
			
			HashMap<String, Object> attrs = utils.getAnnotationParams(annotation);
			
			String type = (String)attrs.get("type");
			String defaultType = null;
			if (isMethod) {
				List<? extends VariableElement> params = ((ExecutableElement)element).getParameters();
				if (params.size() > 0) {
					VariableElement firstParam = params.get(0);
					defaultType = utils.getType(firstParam);
					
				} else {
					utils.debugLog(Kind.WARNING, "Skipping injection into method " + utils.getName(element) + ", at least one argument is required in a setter");
					return;
				}
			} else {
				defaultType = utils.getType((VariableElement)element);
			}
			
			if (type.equals(Kroll_inject_DEFAULT)) {
				attrs.put("type", defaultType);
			}
			
			String name = (String)attrs.get("name");
			if (name.equals(DEFAULT_NAME)) {
				attrs.put("name", utils.getName(element));
			}
			
			injectList.add(attrs);
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

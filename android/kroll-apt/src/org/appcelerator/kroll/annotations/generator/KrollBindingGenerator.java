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
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import javax.annotation.processing.AbstractProcessor;
import javax.annotation.processing.RoundEnvironment;
import javax.annotation.processing.SupportedAnnotationTypes;
import javax.annotation.processing.SupportedOptions;
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
import javax.tools.Diagnostic.Kind;

import org.json.simple.JSONValue;

import freemarker.template.Configuration;
import freemarker.template.DefaultObjectWrapper;
import freemarker.template.Template;
import freemarker.template.TemplateException;

@SupportedAnnotationTypes({
	"org.appcelerator.kroll.annotations.Kroll.proxy",
	"org.appcelerator.kroll.annotations.Kroll.module"})
@SupportedSourceVersion(SourceVersion.RELEASE_6)
@SupportedOptions({"kroll.jsonPackage", "kroll.jsonFile"})
@SuppressWarnings("unchecked")
public class KrollBindingGenerator extends AbstractProcessor {

	// define these here so we can avoid the titanium dependency chicken/egg problem
	protected static final String Kroll_annotation = "org.appcelerator.kroll.annotations.Kroll";
	
	protected static final String Kroll_argument = Kroll_annotation + ".argument";
	protected static final String Kroll_constant = Kroll_annotation + ".constant";
	protected static final String Kroll_getProperty = Kroll_annotation + ".getProperty";
	protected static final String Kroll_inject = Kroll_annotation + ".inject";
	protected static final String Kroll_inject_DEFAULT = Kroll_inject + ".DEFAULT";
	protected static final String Kroll_method = Kroll_annotation + ".method";
	protected static final String Kroll_module = Kroll_annotation + ".module";
	protected static final String Kroll_module_DEFAULT = Kroll_module + ".DEFAULT";
	protected static final String Kroll_property = Kroll_annotation + ".property";
	protected static final String Kroll_proxy = Kroll_annotation + ".proxy";
	protected static final String Kroll_proxy_DEFAULT = Kroll_proxy+ ".DEFAULT";
	protected static final String Kroll_setProperty = Kroll_annotation + ".setProperty";
	protected static final String Kroll_topLevel = Kroll_annotation + ".topLevel";
	
	protected static final String KrollInvocation = "org.appcelerator.kroll.KrollInvocation";
	protected static final String KrollConverter = "org.appcelerator.kroll.KrollConverter";
	
	// this needs to mirror Kroll.DEFAULT_NAME
	protected static final String DEFAULT_NAME = "__default_name__";
	
	protected static final String PROPERTY_JSON_PACKAGE = "kroll.jsonPackage";
	protected static final String PROPERTY_JSON_FILE = "kroll.jsonFile";
	protected static final String DEFAULT_JSON_PACKAGE = "org.appcelerator.titanium.gen";
	protected static final String DEFAULT_JSON_FILE = "bindings.json";
	
	protected Template bindingTemplate;
	// we make these generic because they may be initialized by JSON
	protected Map<Object, Object> properties = new HashMap<Object, Object>();
	protected Map<Object, Object> proxyProperties = new HashMap<Object, Object>();
	protected Configuration fmConfig;
	protected KrollAnnotationUtils utils;
	protected JSONUtils jsonUtils;
	protected String jsonPackage, jsonFile;
	
	public KrollBindingGenerator() {
		super();
		fmConfig = new Configuration();
		fmConfig.setObjectWrapper(new DefaultObjectWrapper());

		try {
			bindingTemplate = new Template("ProxyBinding.fm", new InputStreamReader(
				getClass().getClassLoader().getResourceAsStream(
					"org/appcelerator/kroll/annotations/generator/ProxyBinding.fm")),
					fmConfig);
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}
	
	protected boolean initialized = false;
	
	@Override
	public boolean process(Set<? extends TypeElement> annotations,
			RoundEnvironment roundEnv) {
		
		if (!initialized) {
			initialize();
			initialized = true;
		}
		
		if (!roundEnv.processingOver()) {
			for (Element element : roundEnv.getRootElements()) {
				processKrollProxy(element);
			}
			
		} else {
			generateJSON();
			generateProxies();
		}
		
		return true;
	}
	
	protected void initialize() {
		utils = new KrollAnnotationUtils(processingEnv);
		jsonUtils = new JSONUtils(utils);
		
		String jsonPackage = processingEnv.getOptions().get(PROPERTY_JSON_PACKAGE);
		this.jsonPackage = jsonPackage != null ? jsonPackage : DEFAULT_JSON_PACKAGE;
		
		String jsonFile = processingEnv.getOptions().get(PROPERTY_JSON_FILE);
		this.jsonFile = jsonFile != null ? jsonFile : DEFAULT_JSON_FILE;
		
		try {
			FileObject bindingsFile = processingEnv.getFiler().getResource(StandardLocation.SOURCE_OUTPUT, this.jsonPackage, this.jsonFile);
			properties = (Map<Object,Object>) JSONValue.parseWithException(bindingsFile.openReader(true));
		} catch (Exception e) {
			// file doesn't exist, we'll just create it later
		}
	}
	
	protected void processKrollProxy(final Element element) {
		utils.acceptAnnotations(element, new String[] { Kroll_proxy, Kroll_module },  new KrollVisitor<AnnotationMirror>(){
			
			protected Map<Object,Object> getProxyProperties(String packageName, String proxyClassName) {
				if (properties == null) {
					properties = new HashMap<Object,Object>();
				}
				return jsonUtils.getOrCreateMap(jsonUtils.getOrCreateMap(properties, "proxies"), packageName+"."+proxyClassName);
			}
			
			protected Map<Object,Object> getModule(String moduleClassName) {
				if (properties == null) {
					properties = new HashMap<Object,Object>();
				}
				return jsonUtils.getOrCreateMap(jsonUtils.getOrCreateMap(properties, "modules"), moduleClassName);
			}
			
			@Override
			public boolean visit(AnnotationMirror annotation, Object arg) {
				
				String packageName = utils.getPackage(element);
				String proxyClassName = utils.getName(element);
				proxyProperties = getProxyProperties(packageName, proxyClassName);
				
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
				
				utils.debugLog("Found binding for " +
					(utils.annotationTypeIs(annotation, Kroll_module) ? "module" : "proxy") + " " + apiName);

				proxyAttrs.put("proxyClassName", String.format("%s.%s", packageName, proxyClassName));
				if (proxyAttrs.containsKey("creatableInModule")) {
					String createInModuleClass = (String) proxyAttrs.get("creatableInModule");
					if (!createInModuleClass.equals(Kroll_proxy_DEFAULT)) {
						jsonUtils.appendUnique(getModule(createInModuleClass), "createProxies", proxyAttrs);
					}
				}
				
				if (proxyAttrs.containsKey("parentModule")) {
					String parentModuleClass = (String) proxyAttrs.get("parentModule");
					if (!parentModuleClass.equals(Kroll_module_DEFAULT)) {
						jsonUtils.appendUnique(getModule(parentModuleClass), "childModules", proxyAttrs);
					} else {
						proxyAttrs.remove("parentModule");
					}
				}
				
				boolean isTopLevel = utils.hasAnnotation(element, Kroll_topLevel);
				proxyAttrs.put("isTopLevel", isTopLevel);
				if (isTopLevel) {
					HashMap<String, Object> topLevelParams = utils.getAnnotationParams(element, Kroll_topLevel);
					List<?> topLevelNames = (List<?>)topLevelParams.get("value");
					if (topLevelNames.size() == 1 && topLevelNames.get(0).equals(DEFAULT_NAME)) {
						topLevelNames = Arrays.asList(new String[] { apiName });
					}
					
					proxyAttrs.put("topLevelNames", topLevelNames);
				}
				
				TypeElement type = (TypeElement) element;
				Element superType = processingEnv.getTypeUtils().asElement(type.getSuperclass());
				
				String superTypeName = utils.getName(superType);
				if (!superTypeName.equals("Object")) {
					proxyProperties.put(
						"superProxyBindingClassName", String.format("%s.%sBindingGen", utils.getPackage(superType), superTypeName));
				}
				
				proxyProperties.put("isModule", utils.annotationTypeIs(annotation, Kroll_module));
				proxyProperties.put("packageName", packageName);
				proxyProperties.put("proxyClassName", proxyClassName);
				proxyProperties.put("genClassName", genClassName);
				proxyProperties.put("sourceName", sourceName);
				proxyProperties.put("proxyAttrs", proxyAttrs);
				
				if (utils.annotationTypeIs(annotation, Kroll_module)) {
					getModule(packageName+"."+proxyClassName).put("apiName", apiName);
				}
				
				BindingVisitor visitor = new BindingVisitor();
				for (Element e : element.getEnclosedElements()) {
					e.accept(visitor, null);
				}
				
				return true;
			}
		});
	}
	
	protected class BindingVisitor extends SimpleElementVisitor6<Object, Object> implements KrollVisitor<AnnotationMirror>
	{	
		@Override
		public String visitExecutable(ExecutableElement e, Object p) {
			utils.acceptAnnotations(e, new String[] {
				Kroll_method, Kroll_getProperty, Kroll_setProperty, Kroll_inject, Kroll_topLevel }, this, e);
			return null;
		}
		
		@Override
		public Object visitVariable(VariableElement e, Object p) {
			utils.acceptAnnotations(e, new String[] {
				Kroll_property, Kroll_constant, Kroll_inject }, this, e);
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
				} else if (utils.annotationTypeIs(annotation, Kroll_topLevel)) {
					visitTopLevel(annotation, element);
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
		
		protected void visitMethod(AnnotationMirror annotation, ExecutableElement element) {
			String methodName = element.getSimpleName().toString();
			
			Map<Object,Object> methods = jsonUtils.getOrCreateMap(proxyProperties, "methods");
			Map<Object,Object> methodAttrs = jsonUtils.getOrCreateMap(methods, methodName);
			List<Object> args = new ArrayList<Object>();
			jsonUtils.updateObjectFromAnnotation(methodAttrs, annotation);
			
			//HashMap<String, Object> attrs = utils.getAnnotationParams(annotation);
			methodAttrs.put("hasInvocation", false);
			
			for (VariableElement var: element.getParameters()) {
				String paramType = utils.getType(var);
				if (paramType.equals(KrollInvocation)) {
					methodAttrs.put("hasInvocation", true);
					continue;
				}
				
				String paramName = utils.getName(var);
				
				Map<Object,Object> argParams = new HashMap<Object,Object>();
				argParams.put("sourceName", paramName);
				argParams.put("type", paramType);
				jsonUtils.updateObjectFromAnnotationParams(argParams, utils.getAnnotationParams(var, Kroll_argument));
				
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
			
			methodAttrs.put("apiName", methodAttrs.get("name"));
			if (methodAttrs.get("name").equals(DEFAULT_NAME)) {
				methodAttrs.put("apiName", methodName);
			}
			
			methodAttrs.put("args", args);
			methodAttrs.put("returnType", element.getReturnType().toString());
		}
		
		protected void visitProperty(AnnotationMirror annotation, VariableElement element) {
			boolean isConstant = utils.annotationTypeIs(annotation, Kroll_constant);
			
			Map<Object,Object> propertyMap = jsonUtils.getOrCreateMap(proxyProperties, isConstant ? "constants" : "properties");
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
			
			propertyMap.put(name, property);
		}
		
		protected void visitDynamicProperty(AnnotationMirror annotation, ExecutableElement element) {
			Map<Object,Object> dynamicProperties = jsonUtils.getOrCreateMap(proxyProperties, "dynamicProperties");
			HashMap<String, Object> params = utils.getAnnotationParams(annotation);
			Map<Object,Object> dynamicProperty = new HashMap<Object,Object>(params);
			
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
				dynamicProperty = (Map<Object,Object>) dynamicProperties.get(name);
			} else {
				// setup defaults
				dynamicProperty.put("get", false);
				dynamicProperty.put("set", false);
				dynamicProperty.put("nativeConverter", KrollConverter);
				dynamicProperty.put("javascriptConverter", KrollConverter);
			}
			
			ArrayList<String> defaultProviders = new ArrayList<String>();
			for (VariableElement var: element.getParameters()) {
				if (utils.hasAnnotation(var, Kroll_argument)) {
					defaultProviders.add((String)
						utils.getAnnotationParams(var, Kroll_argument).get("defaultValueProvider"));
				} else {
					defaultProviders.add(KrollConverter);
				}
			}
			
			if (utils.annotationTypeIs(annotation, Kroll_getProperty)) {
				dynamicProperty.put("get", true);
				dynamicProperty.put("getMethodName", methodName);
				dynamicProperty.put("getDefaultProviders", defaultProviders);
			} else {
				dynamicProperty.put("set", true);
				dynamicProperty.put("setMethodName", methodName);
				dynamicProperty.put("setDefaultProviders", defaultProviders);
				dynamicProperty.put("retain", params.get("retain"));
			}
			
			dynamicProperties.put(name, dynamicProperty);
		}
		
		protected void visitInject(AnnotationMirror annotation, Element element, boolean isMethod) {
			List<Object> injectList = jsonUtils.getOrCreateList(proxyProperties, isMethod ? "injectMethods" : "injectFields");
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
		
		protected void visitTopLevel(AnnotationMirror annotation, Element element) {
			Map<Object,Object> topLevelMethods = jsonUtils.getOrCreateMap(proxyProperties, "topLevelMethods");
			HashMap<String, Object> attrs = utils.getAnnotationParams(annotation);
			List<Object> topLevelNames = (List<Object>)attrs.get("value");
			if (topLevelNames.size() == 1 && topLevelNames.get(0).equals(DEFAULT_NAME)) {
				topLevelNames = Arrays.asList(new Object[] { utils.getName(element) });
			}
			
			topLevelMethods.put(utils.getName(element), topLevelNames);
		}
	}
	
	protected void saveTypeTemplate(Template template, String type, Map<Object,Object> root) {
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
	
	protected void generateJSON() {
		try {
			FileObject file = processingEnv.getFiler().createResource(
				StandardLocation.SOURCE_OUTPUT, jsonPackage, jsonFile);
			Writer writer = file.openWriter();
			
			writer.write(JSONValue.toJSONString(properties));
			writer.close();
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}
	
	protected void generateProxies() {
		Map<String,Object> proxies = (Map<String,Object>) properties.get("proxies");
		
		for (String proxyName : proxies.keySet()) {
			Map<Object,Object> proxy = (Map<Object,Object>)proxies.get(proxyName);
			HashMap<Object,Object> root = new HashMap<Object,Object>(proxy);
			root.put("allModules", properties.get("modules"));
			
			saveTypeTemplate(bindingTemplate, proxy.get("packageName")+"."+proxy.get("genClassName"), root);
		}
	}
}

package org.appcelerator.kroll.annotations.generator;

import java.io.IOException;
import java.io.InputStreamReader;
import java.io.Writer;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import javax.annotation.processing.AbstractProcessor;
import javax.annotation.processing.Messager;
import javax.annotation.processing.RoundEnvironment;
import javax.annotation.processing.SupportedAnnotationTypes;
import javax.lang.model.element.AnnotationMirror;
import javax.lang.model.element.AnnotationValue;
import javax.lang.model.element.Element;
import javax.lang.model.element.ExecutableElement;
import javax.lang.model.element.TypeElement;
import javax.lang.model.element.VariableElement;
import javax.lang.model.util.SimpleElementVisitor6;
import javax.tools.Diagnostic;
import javax.tools.JavaFileObject;

import org.appcelerator.kroll.KrollConverter;
import org.appcelerator.kroll.KrollInvocation;
import org.appcelerator.kroll.annotations.Kroll;

import freemarker.template.Configuration;
import freemarker.template.DefaultObjectWrapper;
import freemarker.template.Template;
import freemarker.template.TemplateException;

@SupportedAnnotationTypes({
	"org.appcelerator.kroll.annotations.Kroll.proxy",
	"org.appcelerator.kroll.annotations.Kroll.module"})
public class KrollProxyGenerator extends AbstractProcessor {

	protected Template bindingTemplate, bindingsTemplate;
	protected HashMap<String, Object> bindingProperties = new HashMap<String, Object>();
	protected ArrayList<String> proxies = new ArrayList<String>();
	protected Configuration fmConfig;
	
	public KrollProxyGenerator() {
		fmConfig = new Configuration();
		fmConfig.setObjectWrapper(new DefaultObjectWrapper());

		try {
			bindingTemplate = new Template("ProxyBinding.fm", new InputStreamReader(
				getClass().getClassLoader().getResourceAsStream(
					"org/appcelerator/kroll/annotations/generator/ProxyBinding.fm")),
					fmConfig);
			bindingsTemplate = new Template("ProxyBindings.fm", new InputStreamReader(
					getClass().getClassLoader().getResourceAsStream(
						"org/appcelerator/kroll/annotations/generator/ProxyBindings.fm")),
						fmConfig);
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}
	
	@Override
	public boolean process(Set<? extends TypeElement> annotations,
			RoundEnvironment roundEnv) {

		if (!roundEnv.processingOver()) {
			for (Element element : roundEnv.getRootElements()) {
				generateKrollProxy(element);
			}
		} else {
			generateKrollProxiesClass();
		}
		
		return true;
	}
	
	protected void writeFormat(Writer writer, String format, Object... args) throws IOException
	{
		writer.write(String.format(format, args));
	}
	
	protected boolean annotationTypeIs(AnnotationMirror annotation, Class<?> annotationClass) {
		String annotationType = annotation.getAnnotationType().toString();
		return annotationType.equals(annotationClass.getName().replace("$", "."));
	}
	
	protected void generateKrollProxy(Element element) {
		for (AnnotationMirror annotation : element.getAnnotationMirrors()) {
			String annotationType = annotation.getAnnotationType().toString();
			if (!(annotationTypeIs(annotation, Kroll.proxy.class) ||
				annotationTypeIs(annotation, Kroll.module.class))) {
				continue;
			}
			bindingProperties.clear();
			
			String packageName = processingEnv.getElementUtils().getPackageOf(element).toString();
			String proxyClassName = element.getSimpleName().toString();
			String genClassName = proxyClassName + "Binding";
			String sourceName = String.format("%s.%s", packageName, genClassName);
			
			bindingProperties.put("packageName", packageName);
			bindingProperties.put("proxyClassName", proxyClassName);
			bindingProperties.put("genClassName", genClassName);
			bindingProperties.put("sourceName", sourceName);
			bindingProperties.put("element", element);
			bindingProperties.put("proxyAnnotation", annotation);
			bindingProperties.put("methods", new HashMap<String, HashMap<String, Object>>());
			proxies.add(packageName+"."+proxyClassName);
			
			Writer writer = null;
			try {
				JavaFileObject jfo = processingEnv.getFiler().createSourceFile(sourceName, element);
				writer = jfo.openWriter();
				
				BindingVisitor visitor = new BindingVisitor();
				for (Element e : element.getEnclosedElements()) {
					e.accept(visitor, null);
				}
				
				bindingTemplate.process(bindingProperties, writer);
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
					} catch (Exception e) {
						// TODO Auto-generated catch block
						e.printStackTrace();
					}
				}
			}
		}
	}
	
	protected class BindingVisitor extends SimpleElementVisitor6<Object, Object>
	{	
		@Override
		public String visitExecutable(ExecutableElement e, Object p) {
			List<? extends AnnotationMirror> annotations = e.getAnnotationMirrors();
			for (AnnotationMirror annotation : annotations) {
				if (annotationTypeIs(annotation, Kroll.method.class) ||
					annotationTypeIs(annotation, Kroll.createMethod.class)) {
					addMethod(annotation, e);
					return null;
				}
			}
			return null;
		}
		
		protected void addMethod(AnnotationMirror annotation, ExecutableElement element) {
			HashMap<String, HashMap<String, Object>> methods = 
				(HashMap<String, HashMap<String, Object>>) bindingProperties.get("methods");
						
			ArrayList<HashMap<String, Object>> args = new ArrayList<HashMap<String, Object>>();
			for (VariableElement var: element.getParameters()) {
				String paramType = var.asType().toString();
				if (paramType.equals(KrollInvocation.class.getName())) {
					continue;
				}
				
				String paramName = var.getSimpleName().toString();
				
				HashMap<String, Object> arg = new HashMap<String, Object>();
				arg.put("name", paramName);
				arg.put("type", paramType);
				arg.put("converter", KrollConverter.class);
				arg.put("defaultValueProvider", KrollConverter.class);
				
				for (AnnotationMirror argAnnotation : var.getAnnotationMirrors()) {
					if (!argAnnotation.getAnnotationType().toString().equals(Kroll.argument.class.getName())) {
						continue;
					}
					
					HashMap<String, Object> argParams = mapToHash(
						processingEnv.getElementUtils().getElementValuesWithDefaults(argAnnotation));
					
					arg.putAll(argParams);
				}
				args.add(arg);
			}
			
			HashMap<String, Object> attrs =
				mapToHash(processingEnv.getElementUtils().getElementValuesWithDefaults(annotation));
			attrs.put("annotation", annotation);
			attrs.put("args", args);
			attrs.put("returnType", element.getReturnType().toString());
			attrs.put("converter", KrollConverter.class);
			
			methods.put(element.getSimpleName().toString(), attrs);
		}
	}
	
	protected void generateKrollProxiesClass() {
		Writer writer = null;
		try {
			String type = "org.appcelerator.kroll.KrollProxyBindings";
			JavaFileObject jfo = processingEnv.getFiler().createSourceFile(type);
			writer = jfo.openWriter();
			
			HashMap<String,Object> root = new HashMap<String,Object>();
			root.put("proxies", proxies);
			bindingsTemplate.process(root, writer);
			
		} catch (IOException e) {
			e.printStackTrace();
		} catch (TemplateException e) {
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
	
	protected void debugLog(Diagnostic.Kind debugType, String message) {
		Messager msg = this.processingEnv.getMessager();
		msg.printMessage(Diagnostic.Kind.NOTE, message);
	}
	
	protected void debugLog(String message) {
		debugLog(Diagnostic.Kind.NOTE, message);
	}
	
	protected HashMap<String, Object> mapToHash(Map<? extends ExecutableElement, ? extends AnnotationValue> source) {
		HashMap<String, Object> result = new HashMap<String, Object>();
		for (Map.Entry<? extends ExecutableElement, ?extends AnnotationValue> mirrorEntry : source.entrySet()) {
			String mirrorKey = mirrorEntry.getKey().getSimpleName().toString();
			result.put(mirrorKey, mirrorEntry.getValue());
		}
		
		return result; 
	}
}

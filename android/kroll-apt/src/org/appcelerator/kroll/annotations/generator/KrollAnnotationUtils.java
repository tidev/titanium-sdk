package org.appcelerator.kroll.annotations.generator;

import java.util.HashMap;
import java.util.Map;

import javax.annotation.processing.Messager;
import javax.annotation.processing.ProcessingEnvironment;
import javax.lang.model.element.AnnotationMirror;
import javax.lang.model.element.AnnotationValue;
import javax.lang.model.element.Element;
import javax.lang.model.element.ExecutableElement;
import javax.lang.model.element.VariableElement;
import javax.lang.model.type.DeclaredType;
import javax.tools.Diagnostic;

public class KrollAnnotationUtils {
	protected ProcessingEnvironment env;
	public KrollAnnotationUtils(ProcessingEnvironment env) {
		this.env = env;
	}
	
	public boolean annotationTypeIs(AnnotationMirror annotation, String annotationClass) {
		String annotationType = annotation.getAnnotationType().toString();
		String annotationClassName = annotationClass.replace("$", ".");
		
		return annotationType.equals(annotationClassName);
	}
	
	public boolean annotationTypeIsOneOf(AnnotationMirror annotation, String annotationClasses[]) {
		boolean found = false;
		for (String annClass : annotationClasses) {
			if (annotationTypeIs(annotation, annClass)) {
				found = true;
				break;
			}
		}
		return found;
	}
	
	public void debugLog(Diagnostic.Kind debugType, String message) {
		Messager msg = env.getMessager();
		msg.printMessage(Diagnostic.Kind.NOTE, message);
	}
	
	public void debugLog(String message) {
		debugLog(Diagnostic.Kind.NOTE, message);
	}
	
	public Object convertAnnotationValue(Object value) {
		if (value instanceof DeclaredType) {
			return ((DeclaredType)value).asElement().asType().toString();
		}
		return value;
	}
	
	public HashMap<String, Object> mapToHash(Map<? extends ExecutableElement, ? extends AnnotationValue> source) {
		HashMap<String, Object> result = new HashMap<String, Object>();
		for (Map.Entry<? extends ExecutableElement, ? extends AnnotationValue> mirrorEntry : source.entrySet()) {
			String mirrorKey = mirrorEntry.getKey().getSimpleName().toString();
			Object value = mirrorEntry.getValue().getValue();
			
			result.put(mirrorKey, convertAnnotationValue(value));
		}
		
		return result; 
	}
	
	public HashMap<String, Object> getAnnotationParams(AnnotationMirror annotation) {
		return mapToHash(env.getElementUtils().getElementValuesWithDefaults(annotation));
	}
	
	public String getName(Element el) {
		return el.getSimpleName().toString();
	}
	
	public String getPackage(Element el) {
		return env.getElementUtils().getPackageOf(el).getQualifiedName().toString();
	}
	
	public String getType(VariableElement el) {
		return el.asType().toString();
	}
	
	public String getType(DeclaredType type) {
		return getName(type.asElement());
	}
	
	public String getReturnType(ExecutableElement el) {
		return el.getReturnType().toString();
	}
	
	public boolean typeIs(String type, Class<?> clazz) {
		return type.equals(clazz.getName());
	}
	
	public boolean typeIs(VariableElement el, Class<?> clazz) {
		return typeIs(getType(el), clazz);
	}
	
	public HashMap<String, Object> getAnnotationParams(Element element, String annotationClass) {
		final HashMap<String, Object> params = new HashMap<String, Object>();
		acceptAnnotations(element, annotationClass, new KrollVisitor<AnnotationMirror>() {
			@Override
			public boolean visit(AnnotationMirror element, Object arg) {
				params.putAll(getAnnotationParams(element));
				return true;
			}
		});
		return params;
	}
	
	public void acceptAnnotations(Element element, String annotationClass, KrollVisitor<AnnotationMirror> visitor) {
		acceptAnnotations(element, new String[] { annotationClass }, visitor, null);
	}
	
	public void acceptAnnotations(Element element, String annotationClass, KrollVisitor<AnnotationMirror> visitor, Object arg) {
		acceptAnnotations(element, new String[] { annotationClass }, visitor, arg);
	}
	
	public void acceptAnnotations(Element element, String annotationClasses[], KrollVisitor<AnnotationMirror> visitor) {
		acceptAnnotations(element, annotationClasses, visitor, null);
	}
	
	public void acceptAnnotations(Element element, String annotationClasses[], KrollVisitor<AnnotationMirror> visitor, Object arg) {
		for (AnnotationMirror ann : element.getAnnotationMirrors()) {
			if (!annotationTypeIsOneOf(ann, annotationClasses)) continue;
			if (!visitor.visit(ann, arg)) {
				break;
			}
		}
	}
}

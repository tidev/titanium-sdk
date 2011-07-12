/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll.annotations.generator;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.ListIterator;
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
	
	public void debugLog(String message) {
		debugLog(Diagnostic.Kind.NOTE, message);
	}
	
	public void debugLog(String category, String message) {
		debugLog(Diagnostic.Kind.NOTE, category, message);
	}
	
	public void debugLog(Diagnostic.Kind debugType, String category, String message) {
		debugLog(debugType, "[" + category + "] " + message);
	}
	
	public void debugLog(Diagnostic.Kind debugType, String message) {
		Messager msg = env.getMessager();
		msg.printMessage(Diagnostic.Kind.NOTE, message);
	}
	
	public void logException(Exception exception) {
		debugLog(Diagnostic.Kind.ERROR, exception.getMessage());
		exception.printStackTrace();
	}
	
	@SuppressWarnings("unchecked")
	public Object convertAnnotationValue(Object value) {
		if (value instanceof DeclaredType) {
			return ((DeclaredType)value).asElement().asType().toString();
		} else if (value instanceof List) {
			ArrayList newList = new ArrayList();
			List list = (List)value;
			ListIterator iter = list.listIterator();
			while (iter.hasNext()) {
				AnnotationValue item = (AnnotationValue) iter.next();
				newList.add(convertAnnotationValue(item.getValue()));
			}
			return newList;
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
	
	public boolean acceptAnnotations(Element element, String annotationClass, KrollVisitor<AnnotationMirror> visitor) {
		return acceptAnnotations(element, new String[] { annotationClass }, visitor, null);
	}
	
	public boolean acceptAnnotations(Element element, String annotationClass, KrollVisitor<AnnotationMirror> visitor, Object arg) {
		return acceptAnnotations(element, new String[] { annotationClass }, visitor, arg);
	}
	
	public boolean acceptAnnotations(Element element, String annotationClasses[], KrollVisitor<AnnotationMirror> visitor) {
		return acceptAnnotations(element, annotationClasses, visitor, null);
	}
	
	public boolean acceptAnnotations(Element element, String annotationClasses[], KrollVisitor<AnnotationMirror> visitor, Object arg) {
		for (AnnotationMirror ann : element.getAnnotationMirrors()) {
			if (!annotationTypeIsOneOf(ann, annotationClasses)) continue;
			if (!visitor.visit(ann, arg)) {
				return false;
			}
		}
		return true;
	}
	
	public boolean hasAnnotation(Element element, String annotationClass) {
		for (AnnotationMirror ann : element.getAnnotationMirrors()) {
			if (annotationTypeIs(ann, annotationClass)) return true;
		}
		return false;
	}
	
	public boolean hasAnyAnnotation(Element element, String... annotationClasses) {
		for (AnnotationMirror ann : element.getAnnotationMirrors()) {
			if (annotationTypeIsOneOf(ann, annotationClasses)) return true;
		}
		return false;
	}
}

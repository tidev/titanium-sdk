/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll.annotations;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import org.appcelerator.kroll.KrollConverter;
import org.appcelerator.kroll.KrollDefaultValueProvider;
import org.appcelerator.kroll.KrollNativeConverter;
import org.appcelerator.kroll.KrollScriptableConverter;

public @interface Kroll {
	
	@Retention(RetentionPolicy.RUNTIME)
	@Target(ElementType.PARAMETER)
	public @interface argument {
		String name() default KrollConverter.DEFAULT_NAME;
		Class<? extends KrollScriptableConverter> converter() default KrollConverter.class;
		boolean optional() default false;
		Class<? extends KrollDefaultValueProvider> defaultValueProvider() default KrollConverter.class;
	}
	
	@Retention(RetentionPolicy.SOURCE)
	@Target(ElementType.FIELD)
	public @interface constant {
		String name() default KrollConverter.DEFAULT_NAME;
	}
	
	@Retention(RetentionPolicy.RUNTIME)
	@Target({ElementType.METHOD, ElementType.FIELD})
	public @interface inject {

	}
	
	@Retention(RetentionPolicy.RUNTIME)
	@Target(ElementType.METHOD)
	public @interface method {
		String name() default KrollConverter.DEFAULT_NAME;
		Class<? extends KrollNativeConverter> converter() default KrollConverter.class;
	}
	
	@Retention(RetentionPolicy.RUNTIME)
	@Target(ElementType.METHOD)
	public @interface createMethod {
		String name() default KrollConverter.DEFAULT_NAME;
		Class<? extends KrollNativeConverter> converter() default KrollConverter.class;
	}
	
	@Retention(RetentionPolicy.RUNTIME)
	@Target(ElementType.TYPE)
	public @interface module {
		String name() default KrollConverter.DEFAULT_NAME;
	}

	@Retention(RetentionPolicy.RUNTIME)
	@Target(ElementType.TYPE)
	public @interface nativeView {

	}
	
	@Retention(RetentionPolicy.RUNTIME)
	@Target(ElementType.FIELD)
	public @interface property {
		boolean get() default true;
		boolean set() default true;
		String name() default KrollConverter.DEFAULT_NAME;
		Class<? extends KrollNativeConverter> nativeConverter() default KrollConverter.class;
		Class<? extends KrollScriptableConverter> scriptableConverter() default KrollConverter.class;
	}

	@Retention(RetentionPolicy.RUNTIME)
	@Target(ElementType.METHOD)
	public @interface getProperty {
		String name() default KrollConverter.DEFAULT_NAME;
		Class<? extends KrollNativeConverter> nativeConverter() default KrollConverter.class;
		Class<? extends KrollScriptableConverter> scriptableConverter() default KrollConverter.class;
	}
	
	@Retention(RetentionPolicy.RUNTIME)
	@Target(ElementType.METHOD)
	public @interface setProperty {
		String name() default KrollConverter.DEFAULT_NAME;
		Class<? extends KrollNativeConverter> nativeConverter() default KrollConverter.class;
		Class<? extends KrollScriptableConverter> scriptableConverter() default KrollConverter.class;
	}
	
	@Retention(RetentionPolicy.RUNTIME)
	@Target(ElementType.TYPE)
	public @interface proxy {
		String name() default KrollConverter.DEFAULT_NAME;
	}
}

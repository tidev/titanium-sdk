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
import org.appcelerator.kroll.KrollJavascriptConverter;

public @interface Kroll {
	public static final String DEFAULT_NAME = "__default_name__";
	
	@Retention(RetentionPolicy.SOURCE)
	@Target(ElementType.PARAMETER)
	public @interface argument {
		String name() default DEFAULT_NAME;
		Class<? extends KrollJavascriptConverter> converter() default KrollConverter.class;
		boolean optional() default false;
		Class<? extends KrollDefaultValueProvider> defaultValueProvider() default KrollConverter.class;
	}
	
	@Retention(RetentionPolicy.SOURCE)
	@Target(ElementType.FIELD)
	public @interface constant {
		String name() default DEFAULT_NAME;
	}
	
	@Retention(RetentionPolicy.SOURCE)
	@Target({ElementType.METHOD, ElementType.FIELD})
	public @interface inject {
		String name() default DEFAULT_NAME;
		Class<?> type() default DEFAULT.class;
		public static final class DEFAULT {};
	}
	
	@Retention(RetentionPolicy.SOURCE)
	@Target(ElementType.METHOD)
	public @interface method {
		String name() default DEFAULT_NAME;
		Class<? extends KrollNativeConverter> converter() default KrollConverter.class;
	}
	
	@Retention(RetentionPolicy.SOURCE)
	@Target(ElementType.TYPE)
	public @interface module {
		String name() default DEFAULT_NAME;
		Class<?> parentModule() default DEFAULT.class;
		public static final class DEFAULT {};
	}
	
	@Retention(RetentionPolicy.SOURCE)
	@Target(ElementType.FIELD)
	public @interface property {
		boolean get() default true;
		boolean set() default true;
		String name() default DEFAULT_NAME;
		Class<? extends KrollNativeConverter> nativeConverter() default KrollConverter.class;
		Class<? extends KrollJavascriptConverter> scriptableConverter() default KrollConverter.class;
	}

	@Retention(RetentionPolicy.SOURCE)
	@Target(ElementType.METHOD)
	public @interface getProperty {
		String name() default DEFAULT_NAME;
		Class<? extends KrollNativeConverter> nativeConverter() default KrollConverter.class;
		Class<? extends KrollJavascriptConverter> scriptableConverter() default KrollConverter.class;
	}
	
	@Retention(RetentionPolicy.SOURCE)
	@Target(ElementType.METHOD)
	public @interface setProperty {
		String name() default DEFAULT_NAME;
		Class<? extends KrollNativeConverter> nativeConverter() default KrollConverter.class;
		Class<? extends KrollJavascriptConverter> scriptableConverter() default KrollConverter.class;
		boolean retain() default true;
	}
	
	@Retention(RetentionPolicy.SOURCE)
	@Target(ElementType.TYPE)
	public @interface proxy {
		String name() default DEFAULT_NAME;
		Class<?> creatableInModule() default DEFAULT.class;
		public static final class DEFAULT {};
	}
	
	@Retention(RetentionPolicy.SOURCE)
	@Target(ElementType.METHOD)
	public @interface runOnUiThread {
		
	}
	
	@Retention(RetentionPolicy.SOURCE)
	@Target({ElementType.METHOD, ElementType.TYPE})
	public @interface topLevel {
		String[] value() default DEFAULT_NAME;
	}
}

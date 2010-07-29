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
		String getName() default KrollConverter.DEFAULT_NAME;
		Class<? extends KrollScriptableConverter> getConverter() default KrollConverter.class;
		boolean isOptional() default false;
		Class<? extends KrollDefaultValueProvider> getDefaultValueProvider() default KrollConverter.class;
	}
	
	@Retention(RetentionPolicy.SOURCE)
	@Target(ElementType.FIELD)
	public @interface constant {
		String getName() default KrollConverter.DEFAULT_NAME;
	}
	
	@Retention(RetentionPolicy.RUNTIME)
	@Target({ElementType.METHOD, ElementType.FIELD})
	public @interface inject {

	}
	
	@Retention(RetentionPolicy.RUNTIME)
	@Target(ElementType.METHOD)
	public @interface method {
		String getName() default KrollConverter.DEFAULT_NAME;
		Class<? extends KrollNativeConverter> getConverter() default KrollConverter.class;
	}
	
	@Retention(RetentionPolicy.RUNTIME)
	@Target(ElementType.METHOD)
	public @interface createMethod {
		String getName() default KrollConverter.DEFAULT_NAME;
		Class<? extends KrollNativeConverter> getConverter() default KrollConverter.class;
	}
	
	@Retention(RetentionPolicy.RUNTIME)
	@Target(ElementType.TYPE)
	public @interface module {
		String getName() default KrollConverter.DEFAULT_NAME;
	}

	@Retention(RetentionPolicy.RUNTIME)
	@Target(ElementType.TYPE)
	public @interface nativeView {

	}
	
	@Retention(RetentionPolicy.RUNTIME)
	@Target(ElementType.FIELD)
	public @interface property {
		boolean isGet() default true;
		boolean isSet() default true;
		String getName() default KrollConverter.DEFAULT_NAME;
		Class<? extends KrollNativeConverter> getNativeConverter() default KrollConverter.class;
		Class<? extends KrollScriptableConverter> getScriptableConverter() default KrollConverter.class;
	}

	@Retention(RetentionPolicy.RUNTIME)
	@Target(ElementType.METHOD)
	public @interface getProperty {
		String getName() default KrollConverter.DEFAULT_NAME;
		Class<? extends KrollNativeConverter> getNativeConverter() default KrollConverter.class;
		Class<? extends KrollScriptableConverter> getScriptableConverter() default KrollConverter.class;
	}
	
	@Retention(RetentionPolicy.RUNTIME)
	@Target(ElementType.METHOD)
	public @interface setProperty {
		String getName() default KrollConverter.DEFAULT_NAME;
		Class<? extends KrollNativeConverter> getNativeConverter() default KrollConverter.class;
		Class<? extends KrollScriptableConverter> getScriptableConverter() default KrollConverter.class;
	}
	
	@Retention(RetentionPolicy.RUNTIME)
	@Target(ElementType.TYPE)
	public @interface proxy {
		String getName() default KrollConverter.DEFAULT_NAME;
	}
}

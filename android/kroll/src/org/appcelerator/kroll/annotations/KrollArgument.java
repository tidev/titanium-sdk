/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
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
import org.appcelerator.kroll.KrollScriptableConverter;

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.PARAMETER)
public @interface KrollArgument {
	String getName() default KrollConverter.DEFAULT_NAME;
	Class<? extends KrollScriptableConverter> getConverter() default KrollConverter.class;
	boolean isOptional() default false;
	Class<? extends KrollDefaultValueProvider> getDefaultValueProvider() default KrollConverter.class;
}

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

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
public @interface KrollViewProxy {
	String getName() default KrollConverter.DEFAULT_NAME;
	// TODO: default TiUIView.class
	Class getViewClass() default Object.class;
}

/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll.annotations;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import org.appcelerator.kroll.KrollConverter;
import org.appcelerator.kroll.KrollDefaultValueProvider;
import org.appcelerator.kroll.KrollInvocation;
import org.appcelerator.kroll.KrollNativeConverter;
import org.appcelerator.kroll.KrollJavascriptConverter;

/**
 * The top level Kroll annotation.<br>
 * Using this annotation by itself will have no effect, you'll want to look at sub-annotations:
 * <ul>
 * <li>For binding a basic proxy (including a view proxy), see: {@link proxy @Kroll.proxy}</li>
 * <li>For binding modules, see: {@link module @Kroll.module}</li>
 * <li>For binding methods within a proxy/module, see: {@link method @Kroll.method}, {@link argument @Kroll.argument}</li>
 * <li>For binding properties within a proxy/module, see:
 * 		{@link constant @Kroll.constant}, {@link property @Kroll.property}, {@link getProperty @Kroll.getProperty}, {@link setProperty @Kroll.setProperty}
 * </li>
 * <li>For injecting values into your proxy/module, see: {@link inject @Kroll.inject}</li>
 * <li>For binding a proxy or a proxy method into it's own top level object (i.e. "Titanium" or "setTimeout"), see: {@link topLevel @Kroll.topLevel}</li>
 * </ul>
 * @author Marshall Culpepper
 */
@Documented
public @interface Kroll {
	public static final String DEFAULT_NAME = "__default_name__";
	
	/**
	 * An optional annotation for arguments of a {@link method Kroll method}.
	 * This annotation is retained at runtime so dynamic properties can check for optional arguments in their setters.
	 * <b>Example</b>:<br>
	 * <pre>@Kroll.method public sayHi(@Kroll.argument(optional=true) String name) { }</pre>
	 * @see argument#optional()
	 * @see argument#converter() 
	 * @see argument#defaultValueProvider()
	 * @see argument#name()
	 */
	@Documented
	@Retention(RetentionPolicy.RUNTIME)
	@Target(ElementType.PARAMETER)
	public @interface argument {
		/**
		 * The argument's name used in error messages and source code generation.<br>
		 * <b><i>Default Value</i></b>: The argument's name from Java source
		 */
		String name() default DEFAULT_NAME;
		/**
		 * Marks this argument as optional.<br>
		 * The default value for the argument is pulled from the argument's {@link argument#defaultValueProvider() default value provider}.<br>
		 * <p>
		 * <b>Warning</b>: Make sure that <i>all</i> optional arguments are annotated in your {@link method}, or source code generation / binding may fail.
		 * If the {@link method} has an optional argument in the middle of it's argument list, then all the methods after it should also be annotated as optional. 
		 * </p>
		 * <b><i>Default Value</i></b>: false
		 */
		boolean optional() default false;
		/**
		 * Converter of Rhino/Javascript objects to Java objects suitable for use in Titanium<br>
		 * <p>The value should be the fully qualified name of a class that implements {@link KrollJavascriptConverter}.
		 * The class must also implement a static instance getter called getInstance().</p>
		 * <b><i>Default Value</i></b>: {@link KrollConverter}
		 * @see KrollJavascriptConverter
		 */
		Class<? extends KrollJavascriptConverter> converter() default KrollConverter.class;
		/**
		 * Provider of default values when an optional argument isn't passed in.<br>
		 * <p>The value should be the fully qualified name of a class that implements {@link KrollDefaultValueProvider}.
		 * The class must also implement a static instance getter called getInstance().</p>
		 * <b><i>Default Value</i></b>: {@link KrollConverter}
		 * @see KrollDefaultValueProvider
		 */
		Class<? extends KrollDefaultValueProvider> defaultValueProvider() default KrollConverter.class;
	}
	
	/**
	 * Marks a static final field as a constant for this {@link module} or {@link proxy}.
	 * <b>Note</b>: This only works on static final fields (the value is pulled directly when generating source)
	 * <b>Example</b>:<br>
	 * <pre>@Kroll.constant public static final int ID = 100;</pre>
	 * @see constant#name()
	 */
	@Documented
	@Retention(RetentionPolicy.SOURCE)
	@Target(ElementType.FIELD)
	public @interface constant {
		/**
		 * The name that this constant is bound to.<br>
		 * <b><i>Default Value</i></b>: The name in Java source.
		 */
		String name() default DEFAULT_NAME;
	}
	
	/**
	 * Injects a value by {@link inject#type() type} or {@link inject#name() name} directly into a field or by calling a setter method.
	 * The currently supported injectable values are:
	 * <ul>
	 * <li><b>type</b>: {@link KrollInvocation}</li>
	 * </ul>
	 * <b>Examples</b>:<br>
	 * <pre>@Kroll.inject protected KrollInvocation currentInvocation;</pre>
	 * <pre>@Kroll.inject protected void setCurrentInvocation(KrollInvocation currentInvocation) { }</pre>
	 * 
	 * @see inject#name()
	 * @see inject#type()
	 * @see KrollInvocation
	 */
	@Documented
	@Retention(RetentionPolicy.SOURCE)
	@Target({ElementType.METHOD, ElementType.FIELD})
	public @interface inject {
		/**
		 * <b>Warning</b>: This is reserved for future use, and not implemented yet
		 * The name of an object to inject.
		 * <b><i>Default Value</i></b>: the name of field, or the name of setter method
		 */
		String name() default DEFAULT_NAME;
		/**
		 * The type of object to inject, by class.<br>
		 * <b><i>Default Value</i></b>: The type of the field or first argument of the method
		 */
		Class<?> type() default DEFAULT.class;
		public static final class DEFAULT {};
	}
	
	/**
	 * Declares a method to be exposed as part of this {@link proxy} or {@link module}.<br>
	 * To declare optional arguments of a method, see {@link argument @Kroll.argument}.<br>
	 * <b>Example</b>:<br>
	 * <pre>@Kroll.method public void execute() { }</pre>
	 * 
	 * @see method#name()
	 * @see method#converter()
	 * @see method#runOnUiThread()
	 * @see argument @Kroll.argument
	 */
	@Documented
	@Retention(RetentionPolicy.SOURCE)
	@Target(ElementType.METHOD)
	public @interface method {
		/**
		 * The method's name in the API.<br>
		 * <b><i>Default Value</i></b>: The method's name in Java source.
		 */
		String name() default DEFAULT_NAME;
		/**
		 * Converter of Java objects to Javascript objects suitable for use by the Rhino runtime<br>
		 * <p>The value should be the fully qualified name of a class that implements {@link KrollNativeConverter}.
		 * The class must also implement a static instance getter called getInstance().</p>
		 * <b><i>Default Value</i></b>: {@link KrollConverter}
		 * @see KrollNativeConverter
		 */
		Class<? extends KrollNativeConverter> converter() default KrollConverter.class;
		/**
		 * <p>When set to true, this method will run on the UI thread, blocking the current thread until it finishes executing.
		 * If the current thread is the UI thread, then this simply calls the method directly.
		 * This is functionally equivalent to:</p>
		 * <pre>
		 * if (tiContext.isUIThread()) {
		 *     return callMethod();
		 * } else {
		 *     final AsyncResult result = new AsyncResult();
		 *     tiContext.getActivity().runOnUiThread(new Runnable() {
		 *         public void run() {
		 *             result.setResult(callMethod());
		 *         }
		 *     });
		 *     return result.getResult();
		 * }
		 * </pre>
		 */
		boolean runOnUiThread() default false;
	}
	
	/**
	 * Declares a Kroll module.<br>
	 * Modules differ from {@link proxy proxies} by being statically bound to an API point, and by only having a singleton instance (by default).<br>
	 * Modules may also have a {@link module#parentModule() parent module}, and are where {@link proxy} "create" methods are generated. For more on this, see {@link proxy#creatableInModule()}.<br>
	 * Module classes must extend {@link KrollModule} (which is itself an extension of {@link KrollProxy}).<br>
	 * <b>Example</b>:<br>
	 * <pre>
	 * @Kroll.module
	 * public class APIModule extend KrollModule { .. }
	 * </pre>
	 * @see module#name()
	 * @see module#parentModule()
	 * @see module#contextSpecific()
	 * @see proxy#creatableInModule()
	 */
	@Documented
	@Retention(RetentionPolicy.SOURCE)
	@Target(ElementType.TYPE)
	public @interface module {
		/**
		 * <p>The name of this module in the API.
		 * If this module has a {@link module#parentModule parent module}, this name will be relative to the parent.
		 * All modules are relative to the top level <pre>Titanium</pre> object. If you wish to bind to the global object, see {@link topLevel @Kroll.topLevel}</p>
		 * <b><i>Default Value</i></b>: If the class name follows the naming convention <pre>XYZModule</pre>, then the default API name is <pre>XYZ</pre>. Otherwise, the default name is the same as the class name.
		 */
		String name() default DEFAULT_NAME;
		/**
		 * The parent module class of this module.
		 * <b><i>Default Value</i></b>: No parent module (binds directly to <pre>Titanium</pre>)
		 */
		Class<?> parentModule() default DEFAULT.class;
		public static final class DEFAULT {};
		
		/**
		 * <b>Warning</b>: This is reserved for future use, and not implemented yet
		 * When set to true, this module will be instantiated for every TiContext that is created (instead of only once for the entire application).<br>
		 */
		boolean contextSpecific() default false;
	}
	
	/**
	 * Declares a property to be exposed as part of this {@link proxy} or {@link module}.<br>
	 * Standard properties are automatically written and read into instance fields on the {@link proxy} object.<br>
	 * <b>Example</b>:<br>
	 * <pre>
	 * @Kroll.property protected String username;
	 * </pre>
	 * 
	 * @see property#get()
	 * @see property#set()
	 * @see property#name()
	 * @see property#nativeConverter()
	 * @see property#javascriptConverter()
	 */
	@Documented
	@Retention(RetentionPolicy.SOURCE)
	@Target(ElementType.FIELD)
	public @interface property {
		/**
		 * TODO: document me
		 */
		boolean get() default true;
		/**
		 * TODO: document me
		 */
		boolean set() default true;
		/**
		 * TODO: document me
		 */
		String name() default DEFAULT_NAME;
		/**
		 * Converter of Java objects to Javascript objects suitable for use by the Rhino runtime<br>
		 * <p>The value should be the fully qualified name of a class that implements {@link KrollNativeConverter}.
		 * The class must also implement a static instance getter called getInstance().</p>
		 * <b><i>Default Value</i></b>: {@link KrollConverter}
		 * @see KrollNativeConverter
		 */
		Class<? extends KrollNativeConverter> nativeConverter() default KrollConverter.class;
		/**
		 * Converter of Rhino/Javascript objects to Java objects suitable for use in Titanium<br>
		 * <p>The value should be the fully qualified name of a class that implements {@link KrollJavascriptConverter}.
		 * The class must also implement a static instance getter called getInstance().</p>
		 * <b><i>Default Value</i></b>: {@link KrollConverter}
		 * @see KrollJavascriptConverter
		 */
		Class<? extends KrollJavascriptConverter> javascriptConverter() default KrollConverter.class;
	}

	/**
	 * TODO: document me
	 */
	@Documented
	@Retention(RetentionPolicy.SOURCE)
	@Target(ElementType.METHOD)
	public @interface getProperty {
		String name() default DEFAULT_NAME;
		/**
		 * Converter of Java objects to Javascript objects suitable for use by the Rhino runtime<br>
		 * <p>The value should be the fully qualified name of a class that implements {@link KrollNativeConverter}.
		 * The class must also implement a static instance getter called getInstance().</p>
		 * <b><i>Default Value</i></b>: {@link KrollConverter}
		 * @see KrollNativeConverter
		 */
		Class<? extends KrollNativeConverter> nativeConverter() default KrollConverter.class;
		/**
		 * Converter of Rhino/Javascript objects to Java objects suitable for use in Titanium<br>
		 * <p>The value should be the fully qualified name of a class that implements {@link KrollJavascriptConverter}.
		 * The class must also implement a static instance getter called getInstance().</p>
		 * <b><i>Default Value</i></b>: {@link KrollConverter}
		 * @see KrollJavascriptConverter
		 */
		Class<? extends KrollJavascriptConverter> javascriptConverter() default KrollConverter.class;
		/**
		 * TODO: document me
		 */
		boolean runOnUiThread() default false;
	}
	
	/**
	 * TODO: document me
	 */
	@Documented
	@Retention(RetentionPolicy.SOURCE)
	@Target(ElementType.METHOD)
	public @interface setProperty {
		/**
		 * TODO: document me
		 */
		String name() default DEFAULT_NAME;
		/**
		 * Converter of Java objects to Javascript objects suitable for use by the Rhino runtime<br>
		 * <p>The value should be the fully qualified name of a class that implements {@link KrollNativeConverter}.
		 * The class must also implement a static instance getter called getInstance().</p>
		 * <b><i>Default Value</i></b>: {@link KrollConverter}
		 * @see KrollNativeConverter
		 */
		Class<? extends KrollNativeConverter> nativeConverter() default KrollConverter.class;
		/**
		 * Converter of Rhino/Javascript objects to Java objects suitable for use in Titanium<br>
		 * <p>The value should be the fully qualified name of a class that implements {@link KrollJavascriptConverter}.
		 * The class must also implement a static instance getter called getInstance().</p>
		 * <b><i>Default Value</i></b>: {@link KrollConverter}
		 * @see KrollJavascriptConverter
		 */
		Class<? extends KrollJavascriptConverter> javascriptConverter() default KrollConverter.class;
		/**
		 * TODO: document me
		 */
		boolean retain() default true;
		/**
		 * TODO: document me
		 */
		boolean runOnUiThread() default false;
	}
	
	/**
	 * TODO: document me
	 */
	@Documented
	@Retention(RetentionPolicy.SOURCE)
	@Target(ElementType.TYPE)
	public @interface proxy {
		/**
		 * TODO: document me
		 */
		String name() default DEFAULT_NAME;
		/**
		 * TODO: document me
		 */
		Class<?> creatableInModule() default DEFAULT.class;
		public static final class DEFAULT {};
	}
	
	/**
	 * TODO: document me
	 */
	@Documented
	@Retention(RetentionPolicy.SOURCE)
	@Target({ElementType.METHOD, ElementType.TYPE})
	public @interface topLevel {
		/**
		 * TODO: document me
		 */
		String[] value() default DEFAULT_NAME;
	}
}

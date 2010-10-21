/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll.util;

import org.appcelerator.kroll.KrollConverter;
import org.appcelerator.kroll.KrollDefaultValueProvider;
import org.appcelerator.kroll.KrollInvocation;
import org.appcelerator.kroll.KrollJavascriptConverter;
import org.appcelerator.kroll.KrollMethod;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.titanium.TiContext;

/**
 * A utility / delegate class for generated Proxy and Module bindings
 */
public class KrollBindingUtils {

	public static void assertRequiredArgs(Object[] methodArgs, int requiredArgs, String methodName)
		throws IllegalArgumentException
	{
		if (methodArgs == null) {
			throw new IllegalArgumentException(
				String.format("Expected %d arguments for %s, got 0", requiredArgs, methodName));
		} else if (methodArgs.length < requiredArgs) {
			throw new IllegalArgumentException(
				String.format("Expected %d arguments for %s, got %d", requiredArgs, methodName, methodArgs.length));
		}
	}
	
	public static Object[] getVarArgs(KrollInvocation invocation, Object[] methodArgs, int argIndex,
			KrollJavascriptConverter argConverter, KrollDefaultValueProvider defaultValueProvider)
	{
		int methodArgsLen = methodArgs.length;
		Object[] varArgs = new Object[methodArgsLen-argIndex];
		if (methodArgsLen == argIndex+1) {
			Object firstValue = argConverter.convertJavascript(invocation, methodArgs[argIndex], Object.class);
			if (firstValue instanceof Object[]) {
				varArgs = (Object[]) firstValue;
			} else {
				varArgs[0] = firstValue;
			}
		} else if (methodArgsLen == argIndex) {
			varArgs = (Object[]) defaultValueProvider.getDefaultValue(Object[].class);
		} else {
			for (int i = argIndex; i < methodArgsLen; i++) {
				varArgs[i-argIndex] = argConverter.convertJavascript(invocation, methodArgs[i], Object.class);
			}
		}
		return varArgs;
	}
	
	public static interface KrollProxyCreator {
		public KrollProxy create(TiContext context);
	}
	
	@SuppressWarnings("serial")
	public static KrollMethod createCreateMethod(String proxyName, final KrollProxyCreator creator) {
		return new KrollMethod("create" + proxyName) {
			public Object invoke(KrollInvocation invocation, Object[] args) throws Exception
			{
				KrollProxy proxy = creator.create(invocation.getTiContext());
				
				Object createArgs[] = new Object[args.length];
				for (int i = 0; i < args.length; i++) {
					createArgs[i] = KrollConverter.getInstance().convertJavascript(
						invocation, args[i], Object.class);
				}
				
				proxy.handleCreationArgs(createArgs);
				return KrollConverter.getInstance().convertNative(invocation, proxy);
			}
		};
	}
	
	@SuppressWarnings("serial")
	public static KrollMethod createAccessorMethod(final String accessor) {
		return new KrollMethod(accessor) {
			public Object invoke(KrollInvocation invocation, Object[] args) throws Exception
			{
				String name = invocation.getMethod().getName(); 
				if (name.startsWith("get") || name.startsWith("is")) {
					return KrollConverter.getInstance().convertNative(invocation,
						invocation.getProxy().getProperty(accessor));
				} else {
					invocation.getProxy().setProperty(accessor, args.length > 0 ?
						KrollConverter.getInstance().convertJavascript(invocation, args[0], Object.class) : null, true);
				}
				return KrollProxy.UNDEFINED;
			}
		};
	}
}

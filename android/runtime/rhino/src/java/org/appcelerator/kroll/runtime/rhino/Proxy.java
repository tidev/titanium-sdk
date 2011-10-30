/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll.runtime.rhino;

import java.util.TreeSet;

import org.appcelerator.kroll.KrollProxySupport;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.Function;
import org.mozilla.javascript.IdFunctionObject;
import org.mozilla.javascript.ScriptRuntime;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.Undefined;

import android.util.Log;

/**
 * The base Proxy class that all proxy prototypes extend from
 */
public class Proxy extends EventEmitter
{
	private static final long serialVersionUID = 5384614495908613901L;

	public static final String PROXY_TAG = "Proxy";
	private static final String TAG = PROXY_TAG;

	private static Proxy prototype;
	private static Function setProperty, getProperty;

	private Scriptable properties;
	private KrollProxySupport proxy;
	protected RhinoObject rhinoObject;
	protected boolean isModule = false;

	public static void init(Scriptable exports)
	{
		Proxy prototype = getProxyPrototype();
		IdFunctionObject constructor =
			prototype.exportAsJSClass(MAX_PROTOTYPE_ID, null, false);

		exports.put(PROXY_TAG, exports, constructor);
	}

	public static Function init(Context context, Scriptable exports, String name, Class<? extends Proxy> protoClass)
	{
		try {
			Proxy proxyProto = protoClass.newInstance();
			Scriptable scope = exports;
			if (proxyProto.isModule) {
				// Create a temporary scope to export the prototype into
				scope = context.newObject(exports);
			}

			// Initialize the prototype inheritance chain
			if (proxyProto.getPrototype() == null) {
				Class<? extends Proxy> parentProto = proxyProto.getParent();
				Function parentCtor = init(context, exports, parentProto.getName(), parentProto);
				ProxyFactory.addProxyConstructor(parentProto.getName().replace("Prototype", ""), parentCtor);
			}

			proxyProto.setParentScope(scope);
			IdFunctionObject constructor =
				proxyProto.exportAsJSClass(proxyProto.getMaxPrototypeId(), null, false);

			if (proxyProto.isModule) {
				// Export the actual instance for modules
				Object instance = constructor.construct(context, scope, ScriptRuntime.emptyArgs);
				exports.put(name, exports, instance);
			} else {
				exports.put(name, exports, constructor);
			}
			return constructor;
		} catch (IllegalAccessException e) {
			Log.e(TAG, e.getMessage(), e);
		} catch (InstantiationException e) {
			Log.e(TAG, e.getMessage(), e);
		}
		return null;
	}

	public static Proxy getProxyPrototype()
	{
		if (prototype == null) {
			prototype = new Proxy();
		}
		return prototype;
	}

	public Proxy()
	{
		rhinoObject = new RhinoObject(this);
	}

	public RhinoObject getRhinoObject()
	{
		return rhinoObject;
	}

	public KrollProxySupport getProxy()
	{
		return proxy;
	}

	protected KrollProxySupport createProxy(Object[] args)
	{
		return null;
	}

	protected Class<? extends Proxy> getParent()
	{
		return Proxy.class;
	}

	@Override
	public Scriptable getPrototype()
	{
		return getEventEmitterPrototype();
	}

	protected void handleCreationArgs(Proxy proxy, Scriptable arguments)
	{
		Object[] args = TypeConverter.jsArgumentsToJavaObjectArray(arguments);
		if (args.length == 0 || !(args[0] instanceof KrollScriptableDict)) {
			proxy.proxy = proxy.createProxy(args);
			return;
		}

		KrollScriptableDict creationDict = (KrollScriptableDict) args[0];
		handleCreationDict(proxy, creationDict.getScriptable());

		proxy.proxy = proxy.createProxy(args);
	}

	protected void handleCreationDict(Proxy proxy, Scriptable dict)
	{
		Object[] ids = dict.getIds();
		if (ids == null) {
			return;
		}

		for (Object key : ids) {
			if (!(key instanceof String)) {
				continue;
			}

			String name = (String) key;
			Object value = getProperty(dict, name);
			boolean isGetter = proxy.isGetterOrSetter(name, 0, false);
			boolean isSetter = proxy.isGetterOrSetter(name, 0, true);

			if (!hasProperty(proxy, name) && !isGetter && !isSetter) {
				putProperty(proxy, name, value);

			} else {
				putProperty(proxy.properties, name, value);
			}
		}
	}

	protected Proxy jsConstructor(Scriptable scope, Object[] args)
	{
		try {
			Proxy proxy = getClass().newInstance();
			proxy.properties = Context.getCurrentContext().newObject(scope);
			defineProperty(proxy, "_properties", proxy.properties, DONTENUM);

			if (proxy.proxy != null) {
				return proxy;
			}

			if (args.length > 0) {
				if (args[0] instanceof KrollProxySupport) {
					proxy.proxy = (KrollProxySupport) args[0];
					return proxy;

				} else if (args[0] instanceof Scriptable) {
					Scriptable arg = (Scriptable) args[0];
					if (arg.getClassName().equals("Arguments")) {
						handleCreationArgs(proxy, arg);
						return proxy;
					} else if (TypeConverter.jsScriptableIsCreationDict(arg)) {
						handleCreationDict(proxy, arg);
					}
				}
			}

			for (int i = 0; i < args.length; i++) {
				args[i] = TypeConverter.jsObjectToJavaObject(args[i], scope);
			}
			proxy.proxy = proxy.createProxy(args);

			return proxy;
		} catch (IllegalAccessException e) {
			Log.e(TAG, e.getMessage(), e);
		} catch (InstantiationException e) {
			Log.e(TAG, e.getMessage(), e);
		}
		return null;
	}

	protected void setHasListenersForEventType(Scriptable thisObj, Object[] args)
	{
		if (args.length < 2) {
			throw new IllegalArgumentException("_hasListenersForEventType requires 2 args: event, hasListeners");
		}

		if (!(args[0] instanceof String)) {
			throw new IllegalArgumentException("event type must be a String");
		}

		if (!(args[1] instanceof Boolean)) {
			throw new IllegalArgumentException("hasListeners must be a boolean");
		}

		String event = (String) args[0];
		boolean hasListeners = ((Boolean) args[1]).booleanValue();

		rhinoObject.setHasListenersForEventType(event, hasListeners);
	}

	protected void onPropertiesChanged(Scriptable thisObj, Object[] args)
	{
		if (args.length < 1 || !ScriptRuntime.isArrayObject(args[0])) {
			throw new IllegalArgumentException("Proxy.propertiesChanged requires a list of lists of property name, the old value, and the new value");
		}

		Object[][] changes = (Object[][]) TypeConverter.jsArrayToJavaObjectArray((Scriptable) args[0], thisObj);
		getProxy().onPropertiesChanged(changes);
	}

	protected int getMaxPrototypeId()
	{
		return MAX_PROTOTYPE_ID;
	}

	protected Object getProperty(String name)
	{
		return getProperty(properties, name);
	}

	protected void setProperty(String name, Object value)
	{
		putProperty(properties, name, value);
	}

	protected void onPropertyChanged(String name, Object value)
	{
		KrollProxySupport proxy = getProxy();
		if (proxy == null) {
			return;
		}

		proxy.onPropertyChanged(name,
			TypeConverter.jsObjectToJavaObject(value, this));
	}

	// #string_id_map#
	private static final int
		Id_constructor = 1,
		Id__hasListenersForEventType = 2,
		Id_onPropertiesChanged = 3;

	public static final int MAX_PROTOTYPE_ID = Id_onPropertiesChanged;

	@Override
	protected int findPrototypeId(String s)
	{
		int id = 0;
// #generated# Last update: 2011-10-12 12:41:38 CDT
        L0: { id = 0; String X = null;
            int s_length = s.length();
            if (s_length==11) { X="constructor";id=Id_constructor; }
            else if (s_length==19) { X="onPropertiesChanged";id=Id_onPropertiesChanged; }
            else if (s_length==25) { X="_hasListenersForEventType";id=Id__hasListenersForEventType; }
            if (X!=null && X!=s && !X.equals(s)) id = 0;
            break L0;
        }
// #/generated#
		if (id == 0) {
			return super.findPrototypeId(s);
		}
		return id;
	}
// #/string_id_map#

	@Override
	protected void initPrototypeId(int id)
	{
		String name;
		int arity;
		switch (id) {
			case Id_constructor:
				arity = 0;
				name = "constructor";
				break;
			case Id__hasListenersForEventType:
				arity = 2;
				name = "_hasListenersForEventType";
				break;
			case Id_onPropertiesChanged:
				arity = 1;
				name = "onPropertiesChanged";
				break;
			default:
				super.initPrototypeId(id);
				return;
		}
		initPrototypeMethod(PROXY_TAG, id, name, arity);
	}

	@Override
	public Object execIdCall(IdFunctionObject f,
		Context cx, Scriptable scope, Scriptable thisObj, Object[] args)
	{
		if (!f.hasTag(PROXY_TAG)) {
			return super.execIdCall(f, cx, scope, thisObj, args);
		}

		int id = f.methodId();
		switch (id) {
			case Id_constructor:
				if (thisObj == null) {
					return f.construct(cx, scope, args);
				}
				return jsConstructor(scope, args);
			case Id__hasListenersForEventType:
				setHasListenersForEventType(thisObj, args);
				return Undefined.instance;
			case Id_onPropertiesChanged:
				onPropertiesChanged(thisObj, args);
				return Undefined.instance;
			default:
				throw new IllegalArgumentException(String.valueOf(id));
		}
	}

	@Override
	public Object get(int index, Scriptable start)
	{
		KrollProxySupport proxySupport = getProxy();
		if (proxySupport != null) {
			Object result = proxySupport.getIndexedProperty(index);
			return TypeConverter.javaObjectToJsObject(result, start);
		}
		return super.get(index, start);
	}

	@Override
	public void put(int index, Scriptable start, Object value)
	{
		KrollProxySupport proxySupport = getProxy();
		if (proxySupport != null) {
			Object javaValue = TypeConverter.jsObjectToJavaObject(value, start);
			proxySupport.setIndexedProperty(index, javaValue);
			return;
		}
		super.put(index, start, value);
	}

	@Override
	protected Object equivalentValues(Object value)
	{
		if (!(value instanceof Proxy)) {
			return super.equivalentValues(value);
		}

		Proxy other = (Proxy) value;

		KrollProxySupport proxySupport = getProxy();
		KrollProxySupport otherProxySupport = other.getProxy();
		if (proxySupport == null || otherProxySupport == null) {
			return super.equivalentValues(value);
		}

		return proxySupport.equals(otherProxySupport);
	}

	@Override
	public Object[] getIds()
	{
		Object[] ids = super.getIds();
		if (properties != null) {
			TreeSet<Object> idSet = new TreeSet<Object>();
			if (ids != null) {
				for (Object id : ids) {
					idSet.add(id);
				}
			}

			Object[] propertyIds = properties.getIds();
			if (propertyIds != null) {
				for (Object propertyId : propertyIds) {
					idSet.add(propertyId);
				}
			}
			return idSet.toArray();
		}
		return ids;
	}

	public Scriptable getProperties()
	{
		return properties;
	}

	@Override
	public String getClassName()
	{
		return PROXY_TAG;
	}

}


/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll.runtime.rhino;

import java.util.Stack;

import org.mozilla.javascript.NativeWith;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;

/**
 * A custom "with" for Kroll that's used for giving functions the properly
 * sub-scoped version of it's Titanium object
 */
public class KrollWith extends NativeWith
{
	private static final long serialVersionUID = 3718400751989527171L;

	private static Stack<KrollWith> withStack = new Stack<KrollWith>();

	public static KrollWith enterWith(Object obj, Scriptable scope)
	{
		KrollWith with = new KrollWith(scope, (Scriptable) obj);
		withStack.push(with);
		return with;
	}

	public static void leaveWith()
	{
		withStack.pop();
	}

	public KrollWith(Scriptable parent, Scriptable prototype)
	{
		super(null, prototype);
		setParentScope(new WithScope((ScriptableObject) parent));
	}

	public class WithScope extends ScriptableObject
	{
		private ScriptableObject parent;

		public WithScope(ScriptableObject parent)
		{
			this.parent = parent;
			Object classCache = parent.getAssociatedValue("ClassCache");
			if (classCache != null) {
				this.associateValue("ClassCache", classCache);
			}
		}

		public KrollWith getKrollWith()
		{
			return KrollWith.this; 
		}

		@Override
		public Object get(int index, Scriptable start)
		{
			return parent.get(index, parent);
		}


		public Object get(String name, Scriptable start)
		{
			if ((name.equals("Ti") || name.equals("Titanium"))
				&& prototype.has(name, prototype))
			{
				return prototype.get(name, prototype);
			}

			return parent.get(name, parent);
		}


		public boolean has(String name, Scriptable start)
		{
			return parent.has(name, parent);
		}


		public boolean has(int index, Scriptable start)
		{
			return parent.has(index, parent);
		}


		public void put(String name, Scriptable start, Object value)
		{
			parent.put(name, parent, value);
		}


		public void put(int index, Scriptable start, Object value)
		{
			parent.put(index, parent, value);
		}


		public void delete(String name)
		{
			parent.delete(name);
		}


		public void delete(int index)
		{
			parent.delete(index);
		}


		public Scriptable getPrototype()
		{
			return parent.getPrototype();
		}


		public void setPrototype(Scriptable prototype)
		{
			parent.setPrototype(prototype);
		}


		public Scriptable getParentScope()
		{
			return parent.getParentScope();
		}


		public void setParentScope(Scriptable parent)
		{
			this.parent.setParentScope(parent);
		}


		public Object[] getIds()
		{
			return parent.getIds();
		}


		public Object getDefaultValue(Class<?> hint)
		{
			return parent.getDefaultValue(hint);
		}


		public boolean hasInstance(Scriptable instance)
		{
			return parent.hasInstance(instance);
		}


		@Override
		public String getClassName()
		{
			return "WithScope";
		}
	}
}

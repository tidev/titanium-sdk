package org.appcelerator.kroll.runtime.v8;

import java.lang.ref.WeakReference;
import java.util.HashMap;

import org.appcelerator.kroll.KrollProxySupport;
import org.appcelerator.kroll.KrollObject;
import org.appcelerator.kroll.common.Log;

public final class ReferenceTable
{
	private static HashMap<Integer, Object> references = new HashMap<Integer, Object>();
	private static int lastKey = 1;

	/*
	 * Creates a new reference.
	 * @param object the object to reference and retain
	 * @return an unique key for this reference
	 */
	public static int createReference(Object object)
	{
		int key = lastKey++;
		references.put(key, object);
		return key;
	}

	/*
	 * Destroy the reference.
	 * @param key the key for the reference to destroy.
	 */
	public static void destroyReference(int key)
	{
		Object obj = references.remove(key);
		Log.w("ReferenceTable", "Destroying reference for " + obj);
		// If it's an V8Object, set the ptr to 0, because the proxy is dead on C++ side
		if (obj instanceof KrollProxySupport) {
			KrollProxySupport proxy = (KrollProxySupport) obj;
			KrollObject ko = proxy.getKrollObject();
			if (ko instanceof V8Object) {
				V8Object v8 = (V8Object) ko;
				v8.setPointer(0);
			}
		}
	}

	/*
	 * Makes the reference "weak" which allows it to be
	 * collected if no other references remain.
	 * @param key the key for the reference to weaken.
	 */
	public static void makeWeakReference(int key)
	{
		Object ref = references.get(key);
		references.put(key, new WeakReference<Object>(ref));
	}

	/*
	 * Make the reference strong again to prevent future collection.
	 * This method will return null if the weak reference was
	 * invalidated and the object collected.
	 * @param key the key for the reference.
	 * @return the referenced object if the reference is still valid.
	 */
	public static Object clearWeakReference(int key)
	{
		Object ref = getReference(key);
		references.put(key, ref);
		return ref;
	}

	/*
	 * Returns the referenced object.
	 * @param key the key of the reference.
	 * @return the object if the reference is still valid otherwise null.
	 */
	public static Object getReference(int key)
	{
		Object ref = references.get(key);
		if (ref instanceof WeakReference) {
			ref = ((WeakReference<?>)ref).get();
		}
		return ref;
	}
}

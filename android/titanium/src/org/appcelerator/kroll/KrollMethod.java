package org.appcelerator.kroll;

import org.appcelerator.titanium.kroll.KrollContext;
import org.appcelerator.titanium.util.Log;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.Function;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;

@SuppressWarnings("serial")
public abstract class KrollMethod extends ScriptableObject implements Function {
	
	private static final String TAG = "KrollMethod";
	
	protected String name;
	protected KrollProxy proxy;
	
	public KrollMethod(String name) {
		super();
		this.name = name;
	}
	
	public KrollMethod(KrollProxy proxy, String name) {
		this(name);
		this.proxy = proxy;
	}
	
	@Override
	public String getClassName() {
		return "KrollMethod";
	}
	
	@Override
	public Object call(Context context, Scriptable scope, Scriptable thisObj, Object[] args) {
		KrollInvocation inv = KrollInvocation.createMethodInvocation(KrollContext.getKrollContext(context).getTiContext(), scope, thisObj, name, this, proxy);
		try {
			return invoke(inv, args);
		} catch (Exception e) {
			Log.e(TAG, "Exception calling kroll method " + name, e);
			return Context.getUndefinedValue();
		}
	}
	
	@Override
	public Scriptable construct(Context arg0, Scriptable arg1, Object[] arg2) {
		// TODO Auto-generated method stub
		return null;
	}
	
	public abstract Object invoke(KrollInvocation invocation, Object[] args) throws Exception;
	
}

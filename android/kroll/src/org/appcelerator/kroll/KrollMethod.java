package org.appcelerator.kroll;

import org.mozilla.javascript.Context;
import org.mozilla.javascript.Function;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;

public abstract class KrollMethod extends ScriptableObject implements Function {
	
	protected String name;
	public KrollMethod(String name) {
		super();
		this.name = name;
	}
	
	@Override
	public String getClassName() {
		return "KrollMethod";
	}
	
	@Override
	public Object call(Context context, Scriptable scope, Scriptable thisObj, Object[] args) {
		KrollInvocation inv = KrollInvocation.createMethodInvocation(scope, null, name, this, null);
		try {
			return invoke(inv, args);
		} catch (Exception e) {
			return Context.getUndefinedValue();
		}
	}
	
	@Override
	public Scriptable construct(Context arg0, Scriptable arg1, Object[] arg2) {
		// TODO Auto-generated method stub
		return null;
	}
	
	public abstract Object invoke(KrollInvocation invocation, Object[] args);
	
}

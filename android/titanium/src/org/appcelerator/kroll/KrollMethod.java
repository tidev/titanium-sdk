package org.appcelerator.kroll;

import org.appcelerator.titanium.kroll.KrollContext;
import org.appcelerator.titanium.util.AsyncResult;
import org.appcelerator.titanium.util.Log;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.Function;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;

import android.app.Activity;

@SuppressWarnings("serial")
public abstract class KrollMethod extends ScriptableObject implements Function {
	
	private static final String TAG = "KrollMethod";
	
	protected String name;
	protected boolean runOnUiThread = false;

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
		KrollProxy proxy = null;
		if (thisObj instanceof KrollObject) {
			proxy = ((KrollObject)thisObj).getProxy();
		}
		
		KrollInvocation inv = KrollInvocation.createMethodInvocation(scope, thisObj, name, this, proxy);
		try {
			if (!runOnUiThread) {
				return invoke(inv, args);
			} else {
				Activity activity = inv.getTiContext().getActivity();
				if (inv.getTiContext().isUIThread()) {
					return invoke(inv, args);
				} else {
					final KrollInvocation fInv = inv;
					final Object[] fArgs = args;
					final AsyncResult result = new AsyncResult();
					
					activity.runOnUiThread(new Runnable() {
						public void run() {
							try {
								Object retVal = invoke(fInv, fArgs);
								result.setResult(retVal);
							} catch (Exception e) {
								result.setResult(e);
							}
						}
					});
					
					Object retVal = result.getResult();
					if (retVal instanceof Exception) {
						throw (Exception)retVal;
					} else {
						return retVal;
					}
				}
			}
		} catch (Exception e) {
			Log.e(TAG, "Exception calling kroll method " + name, e);
			Context.throwAsScriptRuntimeEx(e);
			return Context.getUndefinedValue();
		}
	}
	
	@Override
	public Scriptable construct(Context arg0, Scriptable arg1, Object[] arg2) {
		// TODO Auto-generated method stub
		return null;
	}
	
	public abstract Object invoke(KrollInvocation invocation, Object[] args) throws Exception;
	
	public void setRunOnUiThread(boolean runOnUiThread) {
		this.runOnUiThread = runOnUiThread;
	}
}

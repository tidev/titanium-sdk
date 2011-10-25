package org.appcelerator.kroll;

import java.util.HashMap;


public interface KrollFunction
{
	public class FunctionArgs
	{
		public KrollObject krollObject;
		public Object[] args;

		public FunctionArgs(KrollObject krollObject, Object[] args)
		{
			this.krollObject = krollObject;
			this.args = args;
		}
	}


	public void call(KrollObject krollObject, HashMap args);
	public void call(KrollObject krollObject, Object[] args);
	public void callAsync(KrollObject krollObject, HashMap args);
	public void callAsync(KrollObject krollObject, Object[] args);
}


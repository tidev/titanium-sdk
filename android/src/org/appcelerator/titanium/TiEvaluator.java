package org.appcelerator.titanium;

import java.io.IOException;

public interface TiEvaluator
{
	public Object evalJS(String src);
	public Object evalFile(String filename) throws IOException;
	public void fireEvent(); // dispatchInstead?
}

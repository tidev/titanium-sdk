package org.appcelerator.titanium.kroll;

import java.io.IOException;

import org.appcelerator.titanium.TiEvaluator;

public class KrollBridge
	implements TiEvaluator
{

	private KrollContext kroll;
	private TitaniumObject titanium;

	public KrollBridge(KrollContext kroll)
	{
		this.kroll = kroll;
		initializeTitanium();
	}

	public Object evalFile(String filename)
		throws IOException
	{
		return kroll.evalFile(filename);
	}

	public Object evalJS(String src) {
		return kroll.eval(src);
	}

	public void fireEvent() {
	}

	private void initializeTitanium()
	{
		titanium = new TitaniumObject(kroll);
		kroll.put("Titanium", titanium);
		kroll.put("Ti", titanium);
	}
}

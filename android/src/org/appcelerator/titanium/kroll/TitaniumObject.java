package org.appcelerator.titanium.kroll;



public class TitaniumObject extends KrollObject
{
	private static final String LCAT = "TitaniumObject";
	private static final long serialVersionUID = 1L;

	public TitaniumObject(KrollContext kroll) {
		super(kroll);

		this.target = loadModule("Titanium");
	}

	@Override
	public String getClassName() {
		return "Titanium";
	}
}

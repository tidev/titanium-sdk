package ti.modules.titanium.test;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.TiModule;


public class TestModule extends TiModule
{

	private String readOnly;
	private String stringProp;
	private Double numberProp;

	public TestModule(TiContext tiContext) {
		super(tiContext);
	}

	@Override
	public TiDict getConstants() {
		return null;
	}

	public String getReadOnly() {
		return readOnly;
	}

	public void setReadOnly(String readOnly) {
		this.readOnly = readOnly;
	}


	public String getStringProp() {
		return stringProp;
	}

	public void setStringProp(String stringProp) {
		this.stringProp = stringProp;
	}

	public Double getNumberProp() {
		return numberProp;
	}

	public void setNumberProp(Double numberProp) {
		this.numberProp = numberProp;
	}


}

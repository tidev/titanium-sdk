package org.appcelerator.titanium.api;

public interface ITitaniumProgressDialog
{
	enum Type {
		INDETERMINANT,
		DETERMINANT
	}
	enum Location {
		STATUS_BAR,
		DIALOG
	}
	public void setMessage(String message);
	public void setLocation(int location);
	public void setType(int type);
	public void setMin(int min);
	public void setMax(int max);
	public void setPosition(int pos);
	public void show();
	public void hide();
}

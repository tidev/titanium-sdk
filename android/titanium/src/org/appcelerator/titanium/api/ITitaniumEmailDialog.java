package org.appcelerator.titanium.api;

public interface ITitaniumEmailDialog
{
	public void setSubject(String subject);
	public void addTo(String addr);
	public void addCc(String addr);
	public void addBcc(String addr);
	public void setMessage(String msg);
	public void addAttachment(String json);
	public void open();
}

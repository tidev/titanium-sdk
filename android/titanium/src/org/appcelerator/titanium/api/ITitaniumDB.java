package org.appcelerator.titanium.api;

public interface ITitaniumDB {
	public void close();
	public void remove();
	public ITitaniumResultSet execute(String sql, String[] args);
	public int getLastInsertRowId();
	public int getRowsAffected();

	// Internal
	public String getLastException();
	public void setStatementLogging(boolean enabled);
}

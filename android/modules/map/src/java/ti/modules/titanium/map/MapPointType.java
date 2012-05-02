package ti.modules.titanium.map;

public class MapPointType {

	private double latitude;
	private double longitude;
	
	public MapPointType(double latitude, double longitude) 
	{
		this.latitude = latitude;
		this.longitude = longitude;
	}
	
	public double getLatitude() 
	{
		return latitude;
	}
	
	public double getLongitude() 
	{
		return longitude;
	}
}

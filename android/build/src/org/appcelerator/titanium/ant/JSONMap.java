package org.appcelerator.titanium.ant;

import java.io.FileNotFoundException;
import java.util.List;
import java.util.Map;

import org.apache.tools.ant.BuildException;
import org.apache.tools.ant.Task;

public class JSONMap extends Task
{
	private String file, prefix;

	@Override
	public void execute() throws BuildException
	{
		try {
			setProperty(prefix, TiAntUtil.parseJSON(file));
		} catch (FileNotFoundException e) {
			return;
		}
	}

	@SuppressWarnings("unchecked")
	private void setProperty(String property, Object value)
	{
		if (value instanceof Map) {
			Map<String, Object> map = (Map<String, Object>) value;
			for (String key : map.keySet()) {
				String subProperty = property + "." + key;
				setProperty(subProperty, map.get(key));
			}
		} else if (value instanceof List) {
			List<Object> list = (List<Object>) value;
			int i = 0;
			for (Object o : list) {
				String index = property + "." + i;
				setProperty(index, o);
				i++;
			}
			setProperty(property + ".length", list.size());
		} else {
			getProject().setProperty(property, value.toString());
		}
	}

	public String getFile()
	{
		return file;
	}

	public void setFile(String file)
	{
		this.file = file;
	}

	public String getPrefix()
	{
		return prefix;
	}

	public void setPrefix(String prefix)
	{
		this.prefix = prefix;
	}
}

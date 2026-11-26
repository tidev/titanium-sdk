package ti.hermes.spike;

import java.util.concurrent.atomic.AtomicInteger;

/**
 * Stands in for a Titanium proxy. The native code holds one global JNI reference per instance
 * and releases it when Hermes collects the JS object.
 */
public class SpikeProxy
{
	private static final AtomicInteger nextId = new AtomicInteger(1);

	private final int id = nextId.getAndIncrement();
	private String text = "";

	public int getId()
	{
		return this.id;
	}

	public String getText()
	{
		return this.text;
	}

	public void setText(String value)
	{
		this.text = value;
	}
}

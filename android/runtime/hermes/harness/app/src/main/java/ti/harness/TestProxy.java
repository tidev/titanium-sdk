package ti.harness;

import java.lang.ref.PhantomReference;
import java.lang.ref.Reference;
import java.lang.ref.ReferenceQueue;
import java.util.HashSet;

import org.appcelerator.kroll.JSError;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.runtime.hermes.HermesFunction;
import org.appcelerator.kroll.runtime.hermes.HermesObject;

/** The Java proxy that the harness tests bind to JS. */
public class TestProxy extends KrollProxy
{
	// A weak reference is cleared when the finalizer of a canary revives the proxy, so it cannot
	// count live proxies. A phantom reference is enqueued only when the proxy is really gone.
	private static final ReferenceQueue<TestProxy> collected = new ReferenceQueue<>();
	private static final HashSet<PhantomReference<TestProxy>> phantoms = new HashSet<>();
	static TestProxy kept;

	private String text = "";

	public TestProxy()
	{
		synchronized (phantoms) {
			phantoms.add(new PhantomReference<>(this, collected));
		}
	}

	static int liveCount()
	{
		synchronized (phantoms) {
			Reference<? extends TestProxy> reference;
			while ((reference = collected.poll()) != null) {
				phantoms.remove(reference);
			}
			return phantoms.size();
		}
	}

	public Object echo(Object value)
	{
		return value;
	}

	public String describe(Object value)
	{
		if (value == null) {
			return "null";
		}
		String type = value.getClass().getSimpleName();
		if (value instanceof Object[]) {
			return type + "(" + ((Object[]) value).length + ")";
		}
		return type + ":" + value;
	}

	public String getText()
	{
		return this.text;
	}

	public void setText(String value)
	{
		this.text = value;
	}

	public void keepInJava()
	{
		kept = this;
	}

	public Object callBack(Object callback, Object argument)
	{
		return ((HermesFunction) callback).call((HermesObject) getKrollObject(), new Object[] { argument });
	}

	public void fail(String message) throws Exception
	{
		throw new JSError(message);
	}

	public Object makeChild()
	{
		// A proxy that Java creates first. The runtime must build its JS object on demand.
		return new TestProxy();
	}

	public Object[] creationInfo()
	{
		return new Object[] { this.creationArgs == null ? -1 : this.creationArgs.length, this.creationUrl };
	}
}

#!/usr/bin/env python

import run
import sys, string, os
from base64 import b64encode

template_dir = os.path.abspath(os.path.dirname(sys._getframe(0).f_code.co_filename))
titanium_prep = os.path.abspath(os.path.join(template_dir,'titanium_prep.jar'))

JAVA_TEMPLATE = """\
package ${package_name};

import java.util.Collections;
import java.util.Map;
import java.util.HashMap;
import java.nio.CharBuffer;
import java.nio.ByteBuffer;
import java.nio.charset.Charset;
import java.lang.reflect.Method;
import org.appcelerator.kroll.util.KrollAssetHelper;

public class AssetCryptImpl implements KrollAssetHelper.AssetCrypt
{
  private static class Range {
    int offset;
    int length;
    public Range(int offset, int length) {
      this.offset = offset;
      this.length = length;
    }
  }

${init_assets}

  public String readAsset(String path)
  {
    Range range = assets.get(path);
    if (range == null) {
      return null;
    }
    return new String(filterDataInRange(assetsBytes, range.offset, range.length)); // charset encoding?
  }

  private static byte[] filterDataInRange(byte[] data, int offset, int length)
  {
    try {
      Class clazz = Class.forName("org.appcelerator.titanium.TiVerify");
      Method method = clazz.getMethod("filterDataInRange", new Class[] {data.getClass(), int.class, int.class});
      return (byte[])method.invoke(clazz, new Object[] { data, offset, length });
    } catch (Exception e) {
    }
    return new byte[0];
  }
}
"""

class Crypt(object):
  """Helps generate source for an AssetCrypt implementation."""

  KEYS_MAP_VAR = 'keys'

  def __init__(self):
    self.files = []

  def add_asset(self, filename):
    # Convert Window paths to Unix style.
    self.files.append(filename.replace('\\', '/'))

  def generate_code(self, asset_dir, package, target_file):
    """Generate the Java class source and write to target file.

    asset_dir = The assets base directory
    package - The Java package name for this class.
    taget_file - Path to output generate Java source file.
    """
    package_dir = os.path.join(*package.split('.'))
    target_dir = os.path.join(target_file, package_dir)
    try:
      os.makedirs(target_dir)
    except OSError, e:
      pass

    output = open(os.path.join(target_dir, 'AssetCryptImpl.java'), 'w')

    sys.stdout.flush()
    cmdargs = ['java', '-jar', titanium_prep, package, asset_dir]
    cmdargs.extend(self.files)
    so = run.run(cmdargs)

    output.write(string.Template(JAVA_TEMPLATE).substitute(
      package_name = package,
      init_assets = so
    ))

    output.close()

"""
Package a set of JavaScript assets into a generated AssetCrypt Java class.

asset_dir - absolute path to assets folder that contains the sources.
sources - list of paths for each JavaScript asset.
package - The Java package name for the generated class.
target - path to where the java class will be written.
"""
def pack(asset_dir, sources, package, target):
  asset_dir_len = len(asset_dir)
  def rel_asset_path(path):
    return path[asset_dir_len+1:]

  crypt = Crypt()

  # Gather sources together so we can form a crypt to store them.
  for source in sources:
    filename = str(source)
    crypt.add_asset(rel_asset_path(filename))

  # Generate Java code and output to target file.
  crypt.generate_code(asset_dir, package, str(target))


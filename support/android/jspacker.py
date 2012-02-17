#!/usr/bin/env python

import sys, string, os
from base64 import b64encode

JAVA_TEMPLATE = """\
package ${package_name};

import java.util.Collections;
import java.util.Map;
import java.util.HashMap;
import android.util.Base64;
import org.appcelerator.kroll.util.KrollAssetHelper;

public class AssetCryptImpl implements KrollAssetHelper.AssetCrypt
{
  private static Map<String, String> assets = initAssets();

  private static Map<String, String> initAssets()
  {
    Map<String, String> assets = new HashMap<String, String>();

    ${init_assets}

    return Collections.unmodifiableMap(assets);
  }

  public String readAsset(String path)
  {
    String data = assets.get(path);
    if (data == null) {
      return null;
    }
    return new String(Base64.decode(data, Base64.DEFAULT));
  }
}
"""

def to_java_string(s):
  return '"%s"' % s

def to_java_map(map_var, keys_values):
  """Generate code to put a list of key-value pairs into a Java Map instance.

  map_var - The variable name of the Java Map instance.
  keys_values - A list of 2-tuples containing a key and value pair.
  """
  result = []
  for k, v in keys_values:
    result.append('%s.put(%s, %s);' % (map_var, k, v))
  return '\n'.join(result)

def read_file(filename):
  file = open(filename, "rt")
  try:
    lines = file.read()
  finally:
    file.close()
  return lines

class Crypt(object):
  """Helps generate source for an AssetCrypt implementation."""

  KEYS_MAP_VAR = 'keys'

  def __init__(self):
    self.keys = []
    self.assets = []

  def add_asset(self, key, data):
    # Convert Window paths to Unix style.
    self.keys.append(key.replace('\\', '/'))
    self.assets.append(data)

  def generate_code(self, package, target_file):
    """Generate the Java class source and write to target file.

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

    asset_map = []
    for index, key in enumerate(self.keys):
      data = b64encode(self.assets[index])
      asset_map.append((to_java_string(key), to_java_string(data)))

    output.write(string.Template(JAVA_TEMPLATE).substitute(
      package_name = package,
      init_assets = to_java_map('assets', asset_map)
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
    lines = read_file(filename)
    crypt.add_asset(rel_asset_path(filename), lines)

  # Generate Java code and output to target file.
  crypt.generate_code(package, str(target))


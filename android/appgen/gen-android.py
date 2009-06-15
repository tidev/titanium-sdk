#! /usr/bin/env python

from __future__ import with_statement

import os
import shutil
import simplejson as json
from mako.template import Template

#handed a temp directory with the "source", need to return packaged item. apk

#create output directory

#load developer created json

#for each template, specify template, output file, json config

class AndroidGenerator:
  def __init__(self, srcdir):
    self.srcdir = srcdir #temp dir with assets needed for generation
    self.config = self.load_app_config() #data we need to package app

  def load_app_config(self):
    #this will be loaded from a json file eventually
    app = {
      'package' : 'com.appcelerator.tidev',
      'version' : '1',
      'versionString' : '0.5.0',
      'icon' : 'Resources/images/launch_icon.png',
      'appName' : 'Titanium Developer',
      'className' : 'TitaniumDeveloperActivity',
    }
    return app

  def load_template(self, template):
    return Template(filename=template, output_encoding='utf-8', encoding_errors='replace')

  def make_output_path(self, path):
    if not path.startswith('/'):
      path = '/' + path
    return "./app" + path

  def make_source_path(self, path):
    if not path.startswith('/'):
      path = '/' + path
    return self.srcdir + path

  def get_source_path(self):
    return "/src/" + '/'.join(self.config['package'].split('.'))

  def build_output_tree(self):
    shutil.rmtree(self.make_output_path(''))
    os.makedirs(self.make_output_path("/res/drawable"))
    os.makedirs(self.make_output_path(self.get_source_path()))
    shutil.copytree(self.srcdir, self.make_output_path('/assets'))

  def gen_manifest(self):
    tmpl = self.load_template('templates/AndroidManifest.xml.tmpl')
    return tmpl.render(config = self.config)

  def gen_main_class(self):
    tmpl = self.load_template('templates/Main.java.tmpl')
    return tmpl.render(config = self.config)

  def generate(self):
    # create output directory structure
    self.build_output_tree()

    #launcher icon
    icon_path = self.config['icon']
    root, ext = os.path.splitext(icon_path)
    shutil.copy(self.make_source_path(icon_path), self.make_output_path('/res/drawable/icon' + ext))

    with open(self.make_output_path('AndroidManifest.xml'), 'w') as f:
      f.write(self.gen_manifest())

    with open(self.make_output_path(self.get_source_path() + '/' + self.config['className'] + '.java'), "w") as f:
      f.write(self.gen_main_class())



g = AndroidGenerator("./tmp")
g.generate()
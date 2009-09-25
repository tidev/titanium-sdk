#!/usr/bin/env python
#
# Appcelerator Titanium Mobile
# Copyright (c) 2009 Appcelerator, Inc. All Right Reserved.
#
# inliner compiler
#

import os, sys, run, glob, tempfile

def get_platform(arch):
    if arch == 'i386':
        return 'Simulator'
    return 'OS'
    
def compile(include_dir,sdk_version,arch,src_file,obj_file):
    platform = get_platform(arch)
    out = run.run([
        "/Developer/Platforms/iPhone%s.platform/Developer/usr/bin/gcc" % platform,
        "-x",
        "objective-c",
        "-arch",
        arch,
        "-fmessage-length=0",
        "-pipe",
        "-std=c99",
        "-Wno-trigraphs",
        "-fpascal-strings",
        "-Os",
        "-Wreturn-type",
        "-Wunused-variable",
        "-isysroot",
        "/Developer/Platforms/iPhone%s.platform/Developer/SDKs/iPhone%s%s.sdk" % (platform,platform,sdk_version),
        "-gdwarf-2",
        "-mthumb",
        "-miphoneos-version-min=%s" % sdk_version,
        "-I",
        os.path.dirname(src_file),
        "-I",
        include_dir,
        "-F%s" % os.path.dirname(obj_file),
        "-c",
        src_file,
        "-o",
        obj_file
    ])
    print out

def link(sdk_version,arch,obj_files,out_file):
    
    f,path = tempfile.mkstemp('LinkFileList')
    os.close(f)
    f = open(path,"w")
    try:
        for name in obj_files:
            f.write("%s\n" % name)
        f.close()
    
        out = run.run([
            "/Developer/Platforms/iPhoneOS.platform/Developer/usr/bin/libtool",
            "-static",
            "-arch_only",
            arch,
            "-syslibroot",
            "/Developer/Platforms/iPhoneOS.platform/Developer/SDKs/iPhoneOS%s.sdk" % sdk_version,
            "-L%s" % os.path.dirname(out_file),
            "-filelist",
            path,
            "-o",
            out_file
        ])
        print out
    finally:
        os.remove(path)

def inliner(include_dir,sdk_version,arch,src_dir,out_dir):
    src_files = []
    
    for src_file in glob.glob("%s/*.c*" % src_dir):
        src_files.append(src_file)
        
    for src_file in glob.glob("%s/*.m*" % src_dir):
        src_files.append(src_file)
        
    
    for src_file in src_files:  
        name = os.path.basename(src_file)
        out_file = os.path.expanduser(os.path.join(out_dir,os.path.splitext(name)[0]+'.o'))
        compile(include_dir,sdk_version,arch,src_file,out_file)


inliner("/Users/jhaynie/Library/Application Support/Titanium/mobilesdk/osx/0.7.0/iphone/include","3.1","i386","/Users/jhaynie/tmp/iphone/test07/modules/iphone","~/tmp/compiler")

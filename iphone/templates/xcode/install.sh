#!/bin/sh
#
# Simple script that installs the Titanium class templates to the default platform location
# 

if [ ! -d /Developer/Platforms/iPhoneOS.platform/Developer/Library/Xcode/File\ Templates/Appcelerator ]
then
	mkdir /Developer/Platforms/iPhoneOS.platform/Developer/Library/Xcode/File\ Templates/Appcelerator
fi	

if [ ! -d /Developer/Platforms/iPhoneOS.platform/Developer/Library/Xcode/Project\ Templates/Appcelerator ]
then
	mkdir /Developer/Platforms/iPhoneOS.platform/Developer/Library/Xcode/Project\ Templates/Appcelerator
fi	
	
cd "Titanium class"	
cp -R * /Developer/Platforms/iPhoneOS.platform/Developer/Library/Xcode/File\ Templates/Appcelerator
cd ..
cp -R "Titanium Mobile Module" /Developer/Platforms/iPhoneOS.platform/Developer/Library/Xcode/Project\ Templates/Appcelerator
 
#!/bin/sh

cd android
ti build -p android --build-only -s 13.4.1.GA
cd ../ios
ti build -p ios --build-only -s 13.4.1.GA

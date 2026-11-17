################################################################################
# Titanium SDK
# Copyright TiDev, Inc. 04/07/2022-Present
# Licensed under the terms of the Apache Public License
# Please see the LICENSE included with this distribution for details.
################################################################################

# The Android Gradle plugin accepts one CMake file per module.
# This file builds the native runtime of each JS engine: "libkroll-v8.so" and "libkroll-hermes.so".
cmake_minimum_required(VERSION 3.22.1)
project(kroll-runtimes LANGUAGES CXX)

add_subdirectory(v8/src/native kroll-v8)
add_subdirectory(hermes/src/native kroll-hermes)

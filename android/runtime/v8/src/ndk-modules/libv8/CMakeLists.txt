################################################################################
# Titanium SDK
# Copyright TiDev, Inc. 04/07/2022-Present
# Licensed under the terms of the Apache Public License
# Please see the LICENSE included with this distribution for details.
################################################################################

project(v8 LANGUAGES CXX)

# Fetch V8 "version" and release/debug "mode" from generated "V8Settings.cmake" file.
# Needed to determine the path to the V8 libraries and header files below.
include(V8Settings.cmake OPTIONAL)

# Set the root path to the V8 library's files using above settings.
set(LIBV8_DIR "${CMAKE_CURRENT_SOURCE_DIR}/../../../../../../dist/android/libv8/${LIBV8_VERSION}/${LIBV8_MODE}")

# Create a list of "include" directories containing all needed V8 header files.
list(APPEND LIBV8_INCLUDE_DIRS "${LIBV8_DIR}/include")
list(APPEND LIBV8_INCLUDE_DIRS "${LIBV8_DIR}/include/cppgc")
list(APPEND LIBV8_INCLUDE_DIRS "${LIBV8_DIR}/include/cppgc/internal")
list(APPEND LIBV8_INCLUDE_DIRS "${LIBV8_DIR}/include/libplatform")

# Determine subfolder name the pre-built static "*.a" is under for given architecture.
set(V8_ABI ${ANDROID_ABI})
if(${ANDROID_ABI} STREQUAL "armeabi")
	set(V8_ABI "arm")
endif()
if(${ANDROID_ABI} STREQUAL "armeabi-v7a")
	set(V8_ABI "arm")
endif()
if(${ANDROID_ABI} STREQUAL "arm64-v8a")
	set(V8_ABI "arm64")
endif()

# Set up this "v8" project to reference static library and include paths.
add_library(${PROJECT_NAME} STATIC IMPORTED GLOBAL)
set_target_properties(
	${PROJECT_NAME}
	PROPERTIES
	IMPORTED_LOCATION "${LIBV8_DIR}/libs/${V8_ABI}/libv8_monolith.a"
	INTERFACE_INCLUDE_DIRECTORIES "${LIBV8_INCLUDE_DIRS}"
)

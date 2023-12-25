################################################################################
# Titanium SDK
# Copyright TiDev, Inc. 04/07/2022-Present
# Licensed under the terms of the Apache Public License
# Please see the LICENSE included with this distribution for details.
################################################################################

cmake_minimum_required(VERSION 3.10.2)

# Set project/library name and have it use the C++ compiler.
# Note: Built library will be named "lib${PROJECT_NAME}.so".
project(kroll-v8 LANGUAGES CXX)

# Using "ccache" significantly improves build times. (Like 4-5x faster.)
# Mac/Linux users can install it via:  brew install ccache
# Windows users can download it from:  https://ccache.dev
find_program(CCACHE ccache)
if(CCACHE)
	set(CMAKE_C_COMPILER_LAUNCHER ${CCACHE})
	set(CMAKE_CXX_COMPILER_LAUNCHER ${CCACHE})
else()
	message("NOTE: Installing 'ccache' can make builds ~5x faster. Command: brew install ccache")
endif()

# On Windows, we must avoid command line strings being too long by writing arguments to file.
if(WIN32)
	set(CMAKE_C_USE_RESPONSE_FILE_FOR_OBJECTS 1)
	set(CMAKE_C_USE_RESPONSE_FILE_FOR_INCLUDES 1)
	set(CMAKE_C_RESPONSE_FILE_LINK_FLAG "@")
	set(CMAKE_CXX_USE_RESPONSE_FILE_FOR_OBJECTS 1)
	set(CMAKE_CXX_USE_RESPONSE_FILE_FOR_INCLUDES 1)
	set(CMAKE_CXX_RESPONSE_FILE_LINK_FLAG "@")
endif()

# Set up linker flags to delete unused code sections and tune for particular architectures.
set(TI_LINK_FLAGS "-Wl,--gc-sections")
if(CMAKE_BUILD_TYPE STREQUAL "Release")
	string(APPEND TI_LINK_FLAGS ",--strip-all")
endif()
if(${ANDROID_ABI} STREQUAL "armeabi-v7a")
	add_compile_options(-mtune=cortex-a7)
	string(APPEND TI_LINK_FLAGS ",--icf=all")
endif()
if(${ANDROID_ABI} STREQUAL "arm64-v8a")
	add_compile_options(-mtune=cortex-a53)
endif()
if(${ANDROID_ABI} STREQUAL "x86")
	add_compile_options(-mtune=atom)
	string(APPEND TI_LINK_FLAGS ",--icf=all")
endif()

# Set up this library.
add_library(
	${PROJECT_NAME}

	# Build as a shared "*.so" library file.
	SHARED

	# Relative paths to all source C/C++ files.
	AndroidUtil.cpp
	EventEmitter.cpp
	InspectorClient.cpp
	InspectorFrontend.cpp
	JavaObject.cpp
	JNIUtil.cpp
	JSDebugger.cpp
	JSException.cpp
	KrollBindings.cpp
	Proxy.cpp
	ProxyFactory.cpp
	ReferenceTable.cpp
	TypeConverter.cpp
	V8Function.cpp
	V8Object.cpp
	V8Promise.cpp
	V8Runtime.cpp
	V8Util.cpp
	modules/APIModule.cpp
	modules/AssetsModule.cpp
	modules/ScriptsModule.cpp
)

# Add "kroll-apt" generated source files from the "generated" directory.
# Note: Add an empty "CMakeLists.txt" to this directory in case it hasn't been generated yet.
file(MAKE_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}/../../generated)
file(APPEND ${CMAKE_CURRENT_SOURCE_DIR}/../../generated/CMakeLists.txt)
add_subdirectory(${CMAKE_CURRENT_SOURCE_DIR}/../../generated generated)

# Add the "v8" static library project. To be linked to down below.
add_subdirectory(${CMAKE_CURRENT_SOURCE_DIR}/../ndk-modules/libv8 libv8)

# Add definitions used for debugging.
if(CMAKE_BUILD_TYPE STREQUAL "Debug")
	target_compile_definitions(
		${PROJECT_NAME}
		PRIVATE

		TI_DEBUG=1
	)
endif()

# Add compiler flags.
target_compile_options(
	${PROJECT_NAME}
	PRIVATE

	# Disable the following compiler warnings.
	-Wno-conversion-null
	-Wno-deprecated-register
	-Wno-format
	-Wno-format-security
	-Wno-tautological-compare
	-Wno-unused-result

	# Limit stack protector to functions with buffer larger than 4 bytes instead 8. (See: TIMOB-24940)
	-fstack-protector
	--param=ssp-buffer-size=4

	# Optimize for size. Makes a smaller *.so library.
	-Os

	# Strip out unused code.
	-ffunction-sections
	-fdata-sections

	# Disable C++ try/catch and typeid() support. Reduces size of *.so library by ~500 kb.
	-fno-exceptions
	-fno-rtti
)

# Set cmake properties for this library.
set_target_properties(
	${PROJECT_NAME}
	PROPERTIES

	# Setting these 3 properties is equivalent to: -std=c++14
	CXX_STANDARD 14
	CXX_STANDARD_REQUIRED ON
	CXX_EXTENSIONS OFF

	# Set additional linker flags.
	LINK_FLAGS "${TI_LINK_FLAGS}"
)

# Add all header file directories.
target_include_directories(
	${PROJECT_NAME}
	PRIVATE

	${CMAKE_CURRENT_SOURCE_DIR}
	${CMAKE_CURRENT_SOURCE_DIR}/modules
	${CMAKE_CURRENT_SOURCE_DIR}/../../generated
)

# Link to libraries.
target_link_libraries(
	${PROJECT_NAME}

	log     # Provides Android logging functions.
	v8      # Link to our static V8 library.
)

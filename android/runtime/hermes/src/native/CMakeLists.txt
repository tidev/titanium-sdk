################################################################################
# Titanium SDK
# Copyright TiDev, Inc. 04/07/2022-Present
# Licensed under the terms of the Apache Public License
# Please see the LICENSE included with this distribution for details.
################################################################################

cmake_minimum_required(VERSION 3.22.1)

# Set project/library name and have it use the C++ compiler.
# Note: Built library will be named "lib${PROJECT_NAME}.so".
project(kroll-hermes LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Using "ccache" significantly improves build times.
find_program(CCACHE ccache)
if(CCACHE)
	set(CMAKE_C_COMPILER_LAUNCHER ${CCACHE})
	set(CMAKE_CXX_COMPILER_LAUNCHER ${CCACHE})
endif()

# The directory with the JSI sources of the pinned Hermes version ("jsi/jsi.h", "jsi/jsi.cpp").
# The Hermes AAR has no JSI headers and no "libjsi.so", so this project builds the library.
set(TI_HERMES_JSI_DIR "${CMAKE_CURRENT_SOURCE_DIR}/../jsi" CACHE PATH "Directory that contains jsi/jsi.h")

# The directory with the files that the SDK build generates: "KrollJS.h",
# "KrollGeneratedBindings.h", and one source file pair per proxy class from kroll-apt.
set(TI_HERMES_GENERATED_DIR "${CMAKE_CURRENT_SOURCE_DIR}/../../generated" CACHE PATH "Directory with generated sources")

if(NOT EXISTS "${TI_HERMES_JSI_DIR}/jsi/jsi.cpp")
	message(FATAL_ERROR "JSI sources not found in ${TI_HERMES_JSI_DIR}. Set TI_HERMES_JSI_DIR.")
endif()

# "libhermesvm.so" comes from the Hermes AAR as a prefab package.
find_package(hermes-engine REQUIRED CONFIG)

# Set up linker flags to delete unused code sections.
set(TI_LINK_FLAGS "-Wl,--gc-sections")
if(CMAKE_BUILD_TYPE STREQUAL "Release")
	string(APPEND TI_LINK_FLAGS ",--strip-all")
endif()

add_library(jsi SHARED "${TI_HERMES_JSI_DIR}/jsi/jsi.cpp")
target_include_directories(jsi PUBLIC "${TI_HERMES_JSI_DIR}")
target_compile_options(jsi PRIVATE -Wno-non-virtual-dtor -Os)

add_library(
	${PROJECT_NAME}
	SHARED

	AndroidUtil.cpp
	HermesFunction.cpp
	HermesObject.cpp
	HermesPromise.cpp
	JNIUtil.cpp
	JSException.cpp
	JSUtil.cpp
	KrollBindings.cpp
	Proxy.cpp
	ProxyFactory.cpp
	ReferenceTable.cpp
	TiRuntime.cpp
	TypeConverter.cpp
	modules/APIModule.cpp
	modules/AssetsModule.cpp
	modules/ScriptsModule.cpp
)

# Add "kroll-apt" generated source files from the "generated" directory, if it has a build file.
if(EXISTS "${TI_HERMES_GENERATED_DIR}/CMakeLists.txt")
	add_subdirectory("${TI_HERMES_GENERATED_DIR}" generated)
endif()

if(CMAKE_BUILD_TYPE STREQUAL "Debug")
	target_compile_definitions(${PROJECT_NAME} PRIVATE TI_DEBUG=1)
endif()

target_compile_options(
	${PROJECT_NAME}
	PRIVATE

	-Wno-format-security
	# macOS gperf 3.0.3 emits "register", which modern C++ rejects by default.
	-Wno-register
	-Wno-unused-result

	# Limit stack protector to functions with buffer larger than 4 bytes instead 8. (See: TIMOB-24940)
	-fstack-protector
	--param=ssp-buffer-size=4

	# Optimize for size. Makes a smaller *.so library.
	-Os

	# Each function and each data item gets its own section, so the linker can drop unused ones.
	-ffunction-sections
	-fdata-sections
)

target_include_directories(
	${PROJECT_NAME}
	PUBLIC

	${CMAKE_CURRENT_SOURCE_DIR}
	${CMAKE_CURRENT_SOURCE_DIR}/modules
	${TI_HERMES_GENERATED_DIR}
)

target_link_libraries(
	${PROJECT_NAME}

	jsi
	hermes-engine::hermesvm
	android
	log
	${TI_LINK_FLAGS}
)

cmake_minimum_required(VERSION 3.22.1)
project(spike LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# "libhermesvm.so" comes from the Hermes AAR as a prefab package.
find_package(hermes-engine REQUIRED CONFIG)

# The AAR has no JSI headers and needs a "libjsi.so" at load time. Build it from the fetched sources.
set(JSI_DIR ${CMAKE_CURRENT_SOURCE_DIR}/third_party/jsi)
if(NOT EXISTS ${JSI_DIR}/jsi/jsi.cpp)
	message(FATAL_ERROR "JSI sources are missing. Run ./fetch-jsi.sh in the spike directory first.")
endif()
add_library(jsi SHARED ${JSI_DIR}/jsi/jsi.cpp)
target_include_directories(jsi PUBLIC ${JSI_DIR})
target_compile_options(jsi PRIVATE -Wno-non-virtual-dtor)

add_library(spike SHARED spike.cpp)
target_link_libraries(spike jsi hermes-engine::hermesvm log)

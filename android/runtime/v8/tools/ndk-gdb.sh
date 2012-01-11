#!/bin/sh
#
# Copyright (C) 2010 The Android Open Source Project
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

# This wrapper script is used to launch a native debugging session
# on a given NDK application. The application must be debuggable, i.e.
# its android:debuggable attribute must be set to 'true' in the
# <application> element of its manifest.
#
# See docs/NDK-GDB.TXT for usage description. Essentially, you just
# need to launch ndk-gdb from your application project directory
# after doing ndk-build && ant install && <start-application-on-device>
#
# Modifications for Titanium mobile:
#   - allow the manifest path to be overridden so we can debug other apps
#   - override APP_BUILD_SCRIPT, NDK_MODULE_PATH, and the default OPTION_PROJECT

if [ "$ANDROID_NDK" = "" ]; then
	echo "Error: The path to the Android NDK must be set in the ANDROID_NDK environment variable"
	exit 1
fi

ANDROID_NDK_ROOT=$ANDROID_NDK

TOOLS_DIR=$(cd "$(dirname "$0")"; pwd)
PROJECT_DIR=$(cd "$TOOLS_DIR/.."; pwd)

GNUMAKE="make APP_BUILD_SCRIPT=$PROJECT_DIR/src/native/Android.mk NDK_MODULE_PATH=$PROJECT_DIR/src/ndk-modules" \
. $ANDROID_NDK/build/core/ndk-common.sh

force_32bit_binaries

find_program ADB_CMD adb
ADB_FLAGS=

AWK_CMD=awk

DEBUG_PORT=5039

# Delay in seconds between launching the activity and attaching gdbserver on it.
# This is needed because there is no way to know when the activity has really
# started, and sometimes this takes a few seconds.
DELAY=2

PARAMETERS=
OPTION_HELP=no
OPTION_PROJECT=
OPTION_MANIFEST=
OPTION_FORCE=no
OPTION_ADB=
OPTION_EXEC=
OPTION_START=no
OPTION_LAUNCH=
OPTION_LAUNCH_LIST=no
OPTION_DELAY=

check_parameter ()
{
    if [ -z "$2" ]; then
        echo "ERROR: Missing parameter after option '$1'"
        exit 1
    fi
}

check_adb_flags ()
{
    if [ -n "$ADB_FLAGS" ] ; then
        echo "ERROR: Only one of -e, -d or -s <serial> can be used at the same time!"
        exit 1
    fi
}

get_build_var ()
{
    if [ -z "$GNUMAKE" ] ; then
        GNUMAKE=make
    fi
    $GNUMAKE --no-print-dir -f $ANDROID_NDK_ROOT/build/core/build-local.mk -C $PROJECT DUMP_$1
}

get_build_var_for_abi ()
{
    if [ -z "$GNUMAKE" ] ; then
        GNUMAKE=make
    fi
    $GNUMAKE --no-print-dir -f $ANDROID_NDK_ROOT/build/core/build-local.mk -C $PROJECT DUMP_$1 APP_ABI=$2
}

# Used to run an awk script on the manifest
run_awk_manifest_script ()
{
    $AWK_CMD -f $AWK_SCRIPTS/$1 $MANIFEST
}

if [ "$HOST_OS" = "cygwin" ] ; then
# Return native path representation from cygwin one
# $1: a cygwin-compatible path (e.g. /cygdrive/c/some/thing)
# Return: path in host windows representation, e.g. C:/some/thing
#
# We use mixed mode (i.e. / as the directory separator) because
# all the tools we use recognize it properly, and it avoids lots
# of escaping nonsense associated with "\"
#
native_path ()
{
    cygpath -m $1
}
else # HOST_OS != windows
native_path ()
{
    echo "$1"
}
fi # HOST_OS != windows

# We need to ensure the ANDROID_NDK_ROOT is absolute, otherwise calls
# to get_build_var, get_build_var_for_abi and run_awk_manifest_script
# might fail, e.g. when invoked with:
#
#   cd $NDKROOT
#   ./ndk-gdb --project=/path/to/project
#
path_is_absolute ()
{
    local P P2
    P=$1       # copy path
    P2=${P#/}  # remove / prefix, if any
    [ "$P" != "$P2" ]
}

if ! path_is_absolute "$ANDROID_NDK_ROOT"; then
    ANDROID_NDK_ROOT=$(pwd)/$ANDROID_NDK_ROOT
fi


VERBOSE=no
while [ -n "$1" ]; do
    opt="$1"
    optarg=`expr "x$opt" : 'x[^=]*=\(.*\)'`
    case "$opt" in
        --help|-h|-\?)
            OPTION_HELP=yes
            ;;
        --verbose)
            VERBOSE=yes
            ;;
        -s)
            check_parameter $1 $2
            check_adb_flags
            ADB_FLAGS=" -s $2"
            shift
            ;;
        -s*)
            check_adb_flags
            optarg=`expr -- "$opt" : '-s\(.*\)'`
            ADB_FLAGS=" -s $optarg"
            ;;
        -p)
            check_parameter $1 $2
            OPTION_PROJECT="$2"
            shift
            ;;
        -p*)
            optarg=`expr -- "$opt" : '-p\(.*\)'`
            OPTION_PROJECT="$optarg"
            ;;
        -m)
            check_parameter $1 $2
            OPTION_MANIFEST="$2"
            shift
            ;;
        -m*)
            optarg=`expr -- "$opt" : '-m\(.*\)'`
            OPTION_MANIFEST="$optarg"
            ;;
        --exec=*)
            OPTION_EXEC="$optarg"
            ;;
        -x)
            check_parameter $1 $2
            OPTION_EXEC="$2"
            shift
            ;;
        -x*)
            optarg=`expr -- "$opt" : '-x\(.*\)'`
            OPTION_EXEC="$optarg"
            ;;
        -e)
            check_adb_flags
            ADB_FLAGS=" -e"
            ;;
        -d)
            check_adb_flags
            ADB_FLAGS=" -d"
            ;;
        --adb=*) # specify ADB command
            OPTION_ADB="$optarg"
            ;;
        --awk=*)
            AWK_CMD="$optarg"
            ;;
        --project=*)
            OPTION_PROJECT="$optarg"
            ;;
        --manifest=*)
            OPTION_MANIFEST="$optarg"
            ;;
        --port=*)
            DEBUG_PORT="$optarg"
            ;;
        --force)
            OPTION_FORCE="yes"
            ;;
        --launch-list)
            OPTION_LAUNCH_LIST="yes"
            ;;
        --launch=*)
            OPTION_LAUNCH="$optarg"
            ;;
        --start)
            OPTION_START=yes
            ;;
        --delay=*)
            OPTION_DELAY="$optarg"
            ;;
        -*) # unknown options
            echo "ERROR: Unknown option '$opt', use --help for list of valid ones."
            exit 1
        ;;
        *)  # Simply record parameter
            if [ -z "$PARAMETERS" ] ; then
                PARAMETERS="$opt"
            else
                PARAMETERS="$PARAMETERS $opt"
            fi
            ;;
    esac
    shift
done

if [ "$OPTION_HELP" = "yes" ] ; then
    echo "Usage: $PROGNAME [options]"
    echo ""
    echo "Setup a gdb debugging session for your Android NDK application."
    echo "Read $$NDK/docs/NDK-GDB.TXT for complete usage instructions."
    echo ""
    echo "Valid options:"
    echo ""
    echo "    --help|-h|-?      Print this help"
    echo "    --verbose         Enable verbose mode"
    echo "    --force           Kill existing debug session if it exists"
    echo "    --start           Launch application instead of attaching to existing one"
    echo "    --launch=<name>   Same as --start, but specify activity name (see below)"
    echo "    --launch-list     List all launchable activity names from manifest"
    echo "    --delay=<secs>    Delay in seconds between activity start and gdbserver attach."
    echo "    --project=<path>  Specify application project path"
    echo "    --manifest=<path> Specify a path to a custom AndroidManifest.xml"
    echo "    -p <path>         Same as --project=<path>"
    echo "    -m <path>         Same as --manifest=<path>"
    echo "    --port=<port>     Use tcp:localhost:<port> to communicate with gdbserver [$DEBUG_PORT]"
    echo "    --exec=<file>     Execute gdb initialization commands in <file> after connection"
    echo "    -x <file>         Same as --exec=<file>"
    echo "    --adb=<file>      Use specific adb command [$ADB_CMD]"
    echo "    --awk=<file>      Use specific awk command [$AWK_CMD]"
    echo "    -e                Connect to single emulator instance"
    echo "    -d                Connect to single target device"
    echo "    -s <serial>       Connect to specific emulator or device"
    echo ""
    exit 0
fi

log "Android NDK installation path: $ANDROID_NDK_ROOT"

if [ -n "$OPTION_EXEC" ] ; then
    if [ ! -f "$OPTION_EXEC" ]; then
        echo "ERROR: Invalid initialization file: $OPTION_EXEC"
        exit 1
    fi
fi

if [ -n "$OPTION_DELAY" ] ; then
    DELAY="$OPTION_DELAY"
fi

# Check ADB tool version
if [ -n "$OPTION_ADB" ] ; then
    ADB_CMD="$OPTION_ADB"
    log "Using specific adb command: $ADB_CMD"
else
    if [ -z "$ADB_CMD" ] ; then
        echo "ERROR: The 'adb' tool is not in your path."
        echo "       You can change your PATH variable, or use"
        echo "       --adb=<executable> to point to a valid one."
        exit 1
    fi
    log "Using default adb command: $ADB_CMD"
fi

ADB_VERSION=`$ADB_CMD version`
if [ $? != 0 ] ; then
    echo "ERROR: Could not run ADB with: $ADB_CMD"
    exit 1
fi
log "ADB version found: $ADB_VERSION"

ADB_CMD="${ADB_CMD}${ADB_FLAGS}"
log "Using final ADB command: '$ADB_CMD'"


# Used internally by adb_var_shell and adb_var_shell2.
# $1: 1 to redirect stderr to $1, 0 otherwise.
# $2: Variable name that will contain the result
# $3+: Command options
_adb_var_shell ()
{
    # We need a temporary file to store the output of our command
    local CMD_OUT RET OUTPUT VARNAME REDIRECT_STDERR
    REDIRECT_STDERR=$1
    VARNAME=$2
    shift; shift;
    CMD_OUT=`mktemp /tmp/ndk-gdb-cmdout-XXXXXX`
    # Run the command, while storing the standard output to CMD_OUT
    # and appending the exit code as the last line.
    if [ "$REDIRECT_STDERR" != 0 ]; then
        $ADB_CMD shell $@ ";" echo \$? | sed -e 's![[:cntrl:]]!!g' > $CMD_OUT 2>&1
    else
        $ADB_CMD shell $@ ";" echo \$? | sed -e 's![[:cntrl:]]!!g' > $CMD_OUT
    fi
    # Get last line in log, which contains the exit code from the command
    RET=`sed -e '$!d' $CMD_OUT`
    # Get output, which corresponds to everything except the last line
    OUT=`sed -e '$d' $CMD_OUT`
    rm -f $CMD_OUT
    eval $VARNAME=\"\$OUT\"
    return $RET
}

# Run a command through 'adb shell' and captures its standard output
# into a variable. The function's exit code is the same than the command's.
#
# This is required because there is a bug where "adb shell" always returns
# 0 on the host, even if the command fails on the device.
#
# $1: Variable name (e.g. FOO)
# On exit, $FOO is set to the command's standard output
#
# The return status will be 0 (success) if the command succeeded
# or 1 (failure) otherwise.
adb_var_shell ()
{
    _adb_var_shell 0 $@
}

# A variant of adb_var_shell that stores both stdout and stderr in the output
# $1: Variable name
adb_var_shell2 ()
{
    _adb_var_shell 1 $@
}

# Check the awk tool
AWK_SCRIPTS=$ANDROID_NDK_ROOT/build/awk
AWK_TEST=`$AWK_CMD -f $AWK_SCRIPTS/check-awk.awk`
if [ $? != 0 ] ; then
    echo "ERROR: Could not run '$AWK_CMD' command. Do you have it installed properly?"
    exit 1
fi
if [ "$AWK_TEST" != "Pass" ] ; then
    echo "ERROR: Your version of 'awk' is obsolete. Please use --awk=<file> to point to Nawk or Gawk!"
    exit 1
fi

if [ -n "$OPTION_MANIFEST" ]; then
    MANIFEST=$OPTION_MANIFEST
else
    if [ -n "$OPTION_PROJECT" ]; then
        MANIFEST=$OPTION_PROJECT/AndroidManifest.xml
    fi
fi

PROJECT=$PROJECT_DIR
if [ ! -f "$MANIFEST" ] ; then
	echo "ERROR: Your must specify -m AndroidManifest.xml or -p <path/to/project>"
    exit 1
fi

# Extract the package name from the manifest
PACKAGE_NAME=`run_awk_manifest_script extract-package-name.awk`
log "Found package name: $PACKAGE_NAME"
if [ $? != 0 -o "$PACKAGE_NAME" = "<none>" ] ; then
    echo "ERROR: Could not extract package name from $MANIFEST."
    echo "       Please check that the file is well-formed!"
    exit 1
fi

# If --launch-list is used, list all launchable activities, and be done with it
if [ "$OPTION_LAUNCH_LIST" = "yes" ] ; then
    log "Extracting list of launchable activities from manifest:"
    run_awk_manifest_script extract-launchable.awk
    exit 0
fi

APP_ABIS=`get_build_var APP_ABI`
log "ABIs targetted by application: $APP_ABIS"

# Check the ADB command, and that we can connect to the device/emulator
ADB_TEST=`$ADB_CMD shell ls`
if [ $? != 0 ] ; then
    echo "ERROR: Could not connect to device or emulator!"
    echo "       Please check that an emulator is running or a device is connected"
    echo "       through USB to this machine. You can use -e, -d and -s <serial>"
    echo "       in case of multiple ones."
    exit 1
fi

# Check that the device is running Froyo (API Level 8) or higher
#
adb_var_shell API_LEVEL getprop ro.build.version.sdk
if [ $? != 0 -o -z "$API_LEVEL" ] ; then
    echo "ERROR: Could not find target device's supported API level!"
    echo "ndk-gdb will only work if your device is running Android 2.2 or higher."
    exit 1
fi
log "Device API Level: $API_LEVEL"
if [ "$API_LEVEL" -lt "8" ] ; then
    echo "ERROR: ndk-gdb requires a target device running Android 2.2 (API level 8) or higher."
    echo "The target device is running API level $API_LEVEL!"
    exit 1
fi

# Get the target device's supported ABI(s)
# And check that they are supported by the application
#
COMPAT_ABI=none
adb_var_shell CPU_ABI getprop ro.product.cpu.abi
for ABI in $APP_ABIS; do
    if [ "$ABI" = "$CPU_ABI" ] ; then
        COMPAT_ABI=$CPU_ABI
        break
    fi
done

adb_var_shell CPU_ABI2 getprop ro.product.cpu.abi2
if [ $? != 0 -o -z "$CPU_ABI2" ] ; then
    CPU_ABI2=
    log "Device CPU ABI: $CPU_ABI"
else
    log "Device CPU ABIs: $CPU_ABI $CPU_ABI2"
    if [ "$COMPAT_ABI" = "none" ] ; then
        for ABI in $APP_ABIS; do
            if [ "$ABI" = "$CPU_ABI2" ] ; then
                COMPAT_ABI=$CPU_ABI2
                break
            fi
        done
    fi
fi
if [ "$COMPAT_ABI" = none ] ; then
    echo "ERROR: The device does not support the application's targetted CPU ABIs!"
    if [ "$CPU_ABI2" = "$CPU_ABI" ] ; then
        CPU_ABI2=
    fi
    echo "       Device supports:  $CPU_ABI $CPU_ABI2"
    echo "       Package supports: $APP_ABIS"
    exit 1
fi
log "Compatible device ABI: $COMPAT_ABI"

# Check that the application is debuggable, or nothing will work
DEBUGGABLE=`run_awk_manifest_script extract-debuggable.awk`
log "Found debuggable flag: $DEBUGGABLE"
if [ $? != 0 -o "$DEBUGGABLE" != "true" ] ; then
    # If gdbserver exists, then we built with 'ndk-build NDK_DEBUG=1' and it's
    # ok to not have android:debuggable set to true in the original manifest.
    # However, if this is not the case, then complain!!
    if [ -f $PROJECT/libs/$COMPAT_ABI/gdbserver ] ; then
        log "Found gdbserver under libs/$COMPAT_ABI, assuming app was built with NDK_DEBUG=1"
    else
        echo "ERROR: Package $PACKAGE_NAME is not debuggable ! You can fix that in two ways:"
        echo ""
        echo "  - Rebuilt with the NDK_DEBUG=1 option when calling 'ndk-build'."
        echo ""
        echo "  - Modify your manifest to set android:debuggable attribute to \"true\","
        echo "    then rebuild normally."
        echo ""
        echo "After one of these, re-install to the device!"
        exit 1
    fi
else
    # DEBUGGABLE is true in the manifest. Let's check that the user didn't change the
    # debuggable flag in the manifest without calling ndk-build afterwards.
    if [ ! -f $PROJECT/libs/$COMPAT_ABI/gdbserver ] ; then
        echo "ERROR: Could not find gdbserver binary under $PROJECT/libs/$COMPAT_ABI"
        echo "       This usually means you modified your AndroidManifest.xml to set"
        echo "       the android:debuggable flag to 'true' but did not rebuild the"
        echo "       native binaries. Please call 'ndk-build' to do so,"
        echo "       *then* re-install to the device!"
        exit 1
    fi
fi

# Let's check that 'gdbserver' is properly installed on the device too. If this
# is not the case, the user didn't install the proper package after rebuilding.
#
adb_var_shell2 DEVICE_GDBSERVER ls /data/data/$PACKAGE_NAME/lib/gdbserver
if [ $? != 0 ]; then
    echo "ERROR: Non-debuggable application installed on the target device."
    echo "       Please re-install the debuggable version!"
    exit 1
fi
log "Found device gdbserver: $DEVICE_GDBSERVER"

# Get information from the build system
GDBSETUP_INIT=`get_build_var_for_abi NDK_APP_GDBSETUP $COMPAT_ABI`
log "Using gdb setup init: $GDBSETUP_INIT"

TOOLCHAIN_PREFIX=`get_build_var_for_abi TOOLCHAIN_PREFIX $COMPAT_ABI`
log "Using toolchain prefix: $TOOLCHAIN_PREFIX"

APP_OUT=`get_build_var_for_abi TARGET_OUT $COMPAT_ABI`
log "Using app out directory: $APP_OUT"

# Find the <dataDir> of the package on the device
adb_var_shell2 DATA_DIR run-as $PACKAGE_NAME /system/bin/sh -c pwd
if [ $? != 0 -o -z "$DATA_DIR" ] ; then
    echo "ERROR: Could not extract package's data directory. Are you sure that"
    echo "       your installed application is debuggable?"
    exit 1
fi
log "Found data directory: '$DATA_DIR'"

# Launch the activity if needed
if [ "$OPTION_START" = "yes" ] ; then
    # If --launch is used, ignore --start, otherwise extract the first
    # launchable activity name from the manifest and use it as if --launch=<name>
    # was used instead.
    #
    if [ -z "$OPTION_LAUNCH" ] ; then
        OPTION_LAUNCH=`run_awk_manifest_script extract-launchable.awk | sed 2q`
        if [ $? != 0 ] ; then
            echo "ERROR: Could not extract name of launchable activity from manifest!"
            echo "       Try to use --launch=<name> directly instead as a work-around."
            exit 1
        fi
        log "Found first launchable activity: $OPTION_LAUNCH"
        if [ -z "$OPTION_LAUNCH" ] ; then
            echo "ERROR: It seems that your Application does not have any launchable activity!"
            echo "       Please fix your manifest file and rebuild/re-install your application."
            exit 1
        fi
    fi
fi

if [ -n "$OPTION_LAUNCH" ] ; then
    log "Launching activity: $PACKAGE_NAME/$OPTION_LAUNCH"
    run $ADB_CMD shell am start -n $PACKAGE_NAME/$OPTION_LAUNCH
    if [ $? != 0 ] ; then
        echo "ERROR: Could not launch specified activity: $OPTION_LAUNCH"
        echo "       Use --launch-list to dump a list of valid values."
        exit 1
    fi
    # Sleep a bit, it sometimes take one second to start properly
    # Note that we use the 'sleep' command on the device here.
    run $ADB_CMD shell sleep $DELAY
fi

# Find the PID of the application being run
PID=`$ADB_CMD shell ps | $AWK_CMD -f $AWK_SCRIPTS/extract-pid.awk -v PACKAGE=$PACKAGE_NAME`
log "Found running PID: $PID"
if [ $? != 0 -o "$PID" = "0" ] ; then
    echo "ERROR: Could not extract PID of application on device/emulator."
    if [ -n "$OPTION_LAUNCH" ] ; then
        echo "       Weird, this probably means one of these:"
        echo ""
        echo "         - The installed package does not match your current manifest."
        echo "         - The application process was terminated."
        echo ""
        echo "       Try using the --verbose option and look at its output for details."
    else
        echo "       Are you sure the application is already started?"
        echo "       Consider using --start or --launch=<name> if not."
    fi
    exit 1
fi

# Check that there is no other instance of gdbserver running
GDBSERVER_PS=`$ADB_CMD shell ps | grep lib/gdbserver`
if [ -n "$GDBSERVER_PS" ] ; then
    if [ "$OPTION_FORCE" = "no" ] ; then
        echo "ERROR: Another debug session running, Use --force to kill it."
        exit 1
    fi
    log "Killing existing debugging session"
    GDBSERVER_PID=`echo $GDBSERVER_PS | $AWK_CMD -f $AWK_SCRIPTS/extract-pid.awk -v PACKAGE=lib/gdbserver`
    if [ $GDBSERVER_PID != 0 ] ; then
        run $ADB_CMD shell kill -9 $GDBSERVER_PID
    fi
fi

# Launch gdbserver now
DEBUG_SOCKET=debug-socket
run $ADB_CMD shell run-as $PACKAGE_NAME lib/gdbserver +$DEBUG_SOCKET --attach $PID &
if [ $? != 0 ] ; then
    echo "ERROR: Could not launch gdbserver on the device?"
    exit 1
fi
log "Launched gdbserver succesfully."

# Setup network redirection
log "Setup network redirection"
run $ADB_CMD forward tcp:$DEBUG_PORT localfilesystem:$DATA_DIR/$DEBUG_SOCKET
if [ $? != 0 ] ; then
    echo "ERROR: Could not setup network redirection to gdbserver?"
    echo "       Maybe using --port=<port> to use a different TCP port might help?"
    exit 1
fi

# Get the app_server binary from the device
APP_PROCESS=$APP_OUT/app_process
run $ADB_CMD pull /system/bin/app_process `native_path $APP_PROCESS`
log "Pulled app_process from device/emulator."

run $ADB_CMD pull /system/lib/libc.so `native_path $APP_OUT/libc.so`
log "Pulled libc.so from device/emulator."

# Now launch the appropriate gdb client with the right init commands
#
GDBCLIENT=${TOOLCHAIN_PREFIX}gdb
#GDBCLIENT="cgdb -d ${TOOLCHAIN_PREFIX}gdb --"
GDBSETUP=$APP_OUT/gdb.setup
cp -f $GDBSETUP_INIT $GDBSETUP
#uncomment the following to debug the remote connection only
#echo "set debug remote 1" >> $GDBSETUP
echo "file `native_path $APP_PROCESS`" >> $GDBSETUP
echo "target remote :$DEBUG_PORT" >> $GDBSETUP
if [ -n "$OPTION_EXEC" ] ; then
    cat $OPTION_EXEC >> $GDBSETUP
fi
$GDBCLIENT -x `native_path $GDBSETUP`

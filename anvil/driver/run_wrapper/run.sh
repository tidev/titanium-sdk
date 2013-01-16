#!/bin/bash
process="driver.js --mode=remote --platform=<REPLACE WITH PLATFORM>"
driver_timeout=$((20 * 60))

# move back to the actual driver directory - this is important since the driver depends on relative pathing
cd ..

while [ true ]
do
        driver_pid=`ps aux | grep -v grep | grep "$process" | awk '{ print $2 }'`

        if [ $driver_pid ]
        then
                last_mtime=`stat -f %m run_wrapper/run_out.txt`
                driver_timeout_threshold=$(( $(date '+%s') - $driver_timeout ))

                if [ $last_mtime -lt $driver_timeout_threshold ]
                then
                        kill -9 $driver_pid
                fi

        else
		# this is only needed when the driver is running for Android or Mobile Web.
		# Note that this can sometimes fix adb issues but some adb issues require
		# physical interaction
		adb kill-server
		sleep 5;
		adb start-server

                /usr/local/bin/node $process > run_wrapper/run_out.txt 2>&1 &
        fi

        sleep 10
done


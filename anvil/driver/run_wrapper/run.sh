#!/bin/bash
process="driver.js --mode=remote --platform=ios"

# move back to the actual driver directory - this is important since the driver depends on relative pathing
cd ..

while [ true ]
do
        if ps aux | grep -v grep | grep "$process" > /dev/null
        then
                # no-op
                echo "" > /dev/null

        else
                /usr/local/bin/node $process > run_wrapper/run_out.txt 2>&1
        fi

        sleep 10
done


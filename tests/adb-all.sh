#!/bin/bash

DEVICES=`adb devices | tail  -n +2 | cut -sf 1`

for DEVICE in $DEVICES
do
  RUN="adb -s $DEVICE $@"
  ${RUN}
done
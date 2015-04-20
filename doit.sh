#!/bin/bash

git checkout master
git pull appcelerator master
git checkout TIMOB-17791
git rebase master

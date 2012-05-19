#!/usr/bin/env python
#
# This is the module install hook that will be 
# called when your module is first installed
#
import os, sys

def main(args,argc):
  
  # TODO: write your install hook here (optional)

  # exit
  sys.exit(0)



if __name__ == '__main__':
  main(sys.argv,len(sys.argv))


#!/usr/bin/env python
#
# This is the module uninstall hook that will be 
# called when your module is uninstalled
#
import os, sys

def main(args,argc):
  
  # TODO: write your uninstall hook here (optional)

  # exit
  sys.exit(0)


if __name__ == '__main__':
  main(sys.argv,len(sys.argv))


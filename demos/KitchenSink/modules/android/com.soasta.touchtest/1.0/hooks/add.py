#!/usr/bin/env python
#
# This is the module project add hook that will be 
# called when your module is added to a project 
#
import os, sys

def dequote(s):
  if s[0:1] == '"':
      return s[1:-1]
        return s

def main(args,argc):
  # You will get the following command line arguments
  # in the following order:
  #
  # project_dir = the full path to the project root directory
  # project_type = the type of project (desktop, mobile, ipad)
  # project_name = the name of the project
  # 
  project_dir = dequote(os.path.expanduser(args[1]))
  project_type = dequote(args[2])
  project_name = dequote(args[3])
  
  # TODO: write your add hook here (optional)


  # exit
  sys.exit(0)



if __name__ == '__main__':
  main(sys.argv,len(sys.argv))


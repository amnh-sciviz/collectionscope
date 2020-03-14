# -*- coding: utf-8 -*-

import argparse
import os
import shutil
import sys

# input
parser = argparse.ArgumentParser()
parser.add_argument('-name', dest="APP_NAME", default="sample", help="Name of your app; no spaces, alphanumeric plus underscore and dashes")
parser.add_argument('-overwrite', dest="OVERWRITE", action="store_true", help="Overwrite existing folder?")
a = parser.parse_args()

src = "apps/template"
dest = "apps/%s" % a.APP_NAME

if os.path.isdir(dest) and not a.OVERWRITE:
    print("%s already exists. Delete manually or run with -ovewrite flag. Exiting." % dest)
    sys.exit()

if os.path.isdir(dest):
    print("Deleting existing folder %s..." % dest)
    shutil.rmtree(dest)

try:
    shutil.copytree(src, dest)
except OSError as exc:
    if exc.errno == errno.ENOTDIR:
        shutil.copy(src, dest)
    else: raise

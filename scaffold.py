# -*- coding: utf-8 -*-

import argparse
import os
from pprint import pprint
import shutil
import sys

import lib.item_utils as tu
import lib.string_utils as su

# input
parser = argparse.ArgumentParser()
parser.add_argument('-config', dest="CONFIG_FILE", default="config-sample.yml", help="Config file")
parser.add_argument('-overwrite', dest="OVERWRITE", action="store_true", help="Overwrite existing folder?")
a = parser.parse_args()

config = tu.loadConfig(a.CONFIG_FILE)
appName = config["name"]

src = "apps/template"
dest = "apps/%s" % appName
indexFilenameTemplate = src + "/index.html"
indexFilename = dest + "/index.html"

if os.path.isdir(dest) and not a.OVERWRITE:
    print("%s already exists. Delete manually or run with -ovewrite flag. Exiting." % dest)
    # add meta content to index file
    su.formatTextFile(indexFilenameTemplate, indexFilename, config)
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

# add meta content to index file
su.formatTextFile(indexFilename, indexFilename, config)
print("Done.")

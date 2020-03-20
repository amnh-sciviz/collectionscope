# -*- coding: utf-8 -*-

import argparse
import math
import os
from pprint import pprint
import sys

import lib.io_utils as io

# input
parser = argparse.ArgumentParser()
parser.add_argument("-config", dest="CONFIG_FILE", default="config-sample.json", help="Config file")
parser.add_argument("-keys", dest="KEY_LIST", default="content,ui", help="Keys that should be included in config")
a = parser.parse_args()

config = io.readJSON(a.CONFIG_FILE)

OUTPUT_FILE = "apps/{appname}/js/config/config.content.js".format(appname=config["name"])
KEY_LIST =  [k.strip() for k in a.KEY_LIST.split(",")]

io.makeDirectories([OUTPUT_FILE])

outjson = {}
for key in KEY_LIST:
    if key in config:
        outjson[key] = config[key]
    else:
        print("Warning: %s does not exist in %s" % (key, a.CONFIG_FILE))

io.writeJSON(OUTPUT_FILE, outjson, pretty=True, prepend="_.extend(CONFIG, ", append=");")

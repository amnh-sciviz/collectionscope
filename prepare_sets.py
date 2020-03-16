# -*- coding: utf-8 -*-

import argparse
import math
import os
from pprint import pprint
import sys

import lib.io_utils as io
import lib.list_utils as lu

# input
parser = argparse.ArgumentParser()
parser.add_argument("-config", dest="CONFIG_FILE", default="config-sample.json", help="Config file")
a = parser.parse_args()

config = io.readJSON(a.CONFIG_FILE)
configSets = config["sets"]

INPUT_FILE = config["metadata"]["src"]
ID_COLUMN = config["metadata"]["id"]
OUTPUT_DIR = "apps/{appname}/".format(appname=config["name"])
OUTPUT_SET_DIR = OUTPUT_DIR + "data/sets/"
CONFIG_FILE = OUTPUT_DIR + "js/config/config.sets.js"

# Make sure output dirs exist
io.makeDirectories([OUTPUT_SET_DIR, CONFIG_FILE])
fieldnames, items = io.readCsv(INPUT_FILE, parseNumbers=False)

# Sort so that index corresponds to ID
items = sorted(items, key=lambda item: item[ID_COLUMN])
items = lu.addIndices(items)


# Write metadata file
outjson = {
    "rows": rows,
    "cols": cols,
    "patterns": patterns
}
io.writeJSON(OUTPUT_FILE, outjson)

# Write config file
outjson = {
    "metadata": {
        "src": OUTPUT_FILE
    }
}
io.writeJSON(CONFIG_FILE, outjson, pretty=True, prepend="_.extend(CONFIG, ", append=");")

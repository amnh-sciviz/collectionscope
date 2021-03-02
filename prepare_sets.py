# -*- coding: utf-8 -*-

import argparse
import math
import os
from pprint import pprint
import sys

import lib.io_utils as io
import lib.item_utils as tu
import lib.list_utils as lu

# input
parser = argparse.ArgumentParser()
parser.add_argument("-config", dest="CONFIG_FILE", default="config-sample.yml", help="Config file")
a = parser.parse_args()

config = tu.loadConfig(a.CONFIG_FILE)
configStories = config["stories"]

OUTPUT_DIR = "apps/{appname}/".format(appname=config["name"])
OUTPUT_SET_DIR_REL = "data/sets/"
OUTPUT_SET_DIR = OUTPUT_DIR + OUTPUT_SET_DIR_REL
CONFIG_FILE = OUTPUT_DIR + "js/config/config.sets.js"

# Make sure output dirs exist
io.makeDirectories([OUTPUT_SET_DIR, CONFIG_FILE])
items, categories = tu.getItems(config)

# Remove existing data
io.removeFiles(OUTPUT_SET_DIR + "*.json")

jsonsets = {}
for keyName, options in configStories.items():

    if "query" not in options:
        continue

    setItems = lu.filterByQueryString(items, options["query"])
    if len(setItems) > 0:
        print("%s results found for '%s'" % (len(setItems), options["query"]))
    else:
        print("Warning: '%s' produces no results" % options["query"])
        continue

    # limit the results if specified
    if "limit" in options and len(setItems) > options["limit"]:
        setItems = setItems[:options["limit"]]

    # Write set file
    outjson = [item["index"] for item in setItems]
    if len(setItems) > 10:
        setOutFile = OUTPUT_SET_DIR + keyName + ".json"
        setOutFileRel = OUTPUT_SET_DIR_REL + keyName + ".json"
        io.writeJSON(setOutFile, outjson)
        jsonsets[keyName] = {"src": setOutFileRel}
    # if only a small amount of items, don't bother to put it in its own json file
    else:
        jsonsets[keyName] = {"indices": outjson}

# Write config file
outjson = {
    "sets": jsonsets
}
io.writeJSON(CONFIG_FILE, outjson, pretty=True, prepend="_.extend(CONFIG, ", append=");")

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
parser.add_argument("-config", dest="CONFIG_FILE", default="config-sample.json", help="Config file")
a = parser.parse_args()

config = io.readJSON(a.CONFIG_FILE)
configMeta = config["metadata"]

OUTPUT_DIR = "apps/{appname}/".format(appname=config["name"])
OUTPUT_FILE_REL = "data/metadata.json"
OUTPUT_FILE = OUTPUT_DIR + OUTPUT_FILE_REL
CONFIG_FILE = OUTPUT_DIR + "js/config/config.metadata.js"
COLUMNS =  [col for col in configMeta["cols"] if "output" in col and col["output"]]

# Make sure output dirs exist
io.makeDirectories([OUTPUT_FILE, CONFIG_FILE])

sets, items = tu.getItems(config)

# only take cols that have from key
cols = [col["toKey"] for col in COLUMNS if "fromKey" in col]

filteredSets = {}
for setKey, set in sets.items():
    if setKey in cols:
        filteredSets[setKey] = set.copy()

rows = []
for item in items:
    row = []
    for col in COLUMNS:
        if "fromKey" not in col:
            continue
        toKey = col["toKey"]
        value = item[toKey]
        row.append(value)
    rows.append(row)

patterns = {}
for col in COLUMNS:
    if "pattern" in col:
        patterns[col["toKey"]] = col["pattern"]

# Write metadata file
outjson = {
    "rows": rows,
    "cols": cols,
    "patterns": patterns,
    "sets": filteredSets
}
io.writeJSON(OUTPUT_FILE, outjson)

# Write config file
outjson = {
    "metadata": {
        "src": OUTPUT_FILE_REL
    }
}
io.writeJSON(CONFIG_FILE, outjson, pretty=True, prepend="_.extend(CONFIG, ", append=");")

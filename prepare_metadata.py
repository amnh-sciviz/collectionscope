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
parser.add_argument("-in", dest="INPUT_FILE", default="data/metadata.csv", help="CSV file with metadata")
parser.add_argument("-id", dest="ID_COLUMN", default="Id", help="Your column that has a unique identifier")
parser.add_argument("-app", dest="APP_NAME", default="sample", help="Name of your app that you created with scaffold.py")
parser.add_argument("-cols", dest="COLUMNS", default="Title=title&Id=id", help="A list of key maps as a query string, e.g. fromKey1=toKey2&fromKey2=toKey2. You must have at least column.")
parser.add_argument("-out", dest="OUTPUT_DIR", default="apps/{appname}/", help="Output directory; most likely leave as is")
a = parser.parse_args()

OUTPUT_DIR = a.OUTPUT_DIR.format(appname=a.APP_NAME)
OUTPUT_FILE = OUTPUT_DIR + "data/metadata.json"
CONFIG_FILE = OUTPUT_DIR + "js/config/config.metadata.js"
COLUMNS =  lu.parseQueryString(a.COLUMNS)

# Make sure output dirs exist
io.makeDirectories([OUTPUT_FILE, CONFIG_FILE])
fieldnames, items = io.readCsv(a.INPUT_FILE, parseNumbers=False)

# Sort so that index corresponds to ID
items = sorted(items, key=lambda item: item[a.ID_COLUMN])

cols = [toKey for fromKey, toKey in COLUMNS]
rows = []
for item in items:
    row = []
    for fromKey, toKey in COLUMNS:
        value = item[fromKey] if fromKey in item else ""
        row.append(value)
    rows.append(row)

# Write metadata file
outjson = {
    "rows": rows,
    "cols": cols
}
io.writeJSON(OUTPUT_FILE, outjson)

# Write config file
outjson = {
    "metadata": {
        "src": OUTPUT_FILE
    }
}
io.writeJSON(CONFIG_FILE, outjson, pretty=True, prepend="_.extend(CONFIG, ", append=");")

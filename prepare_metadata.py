# -*- coding: utf-8 -*-

import argparse
import math
import os
from pprint import pprint
import sys

import lib.io_utils as io
import lib.item_utils as tu
import lib.list_utils as lu
import lib.math_utils as mu

# input
parser = argparse.ArgumentParser()
parser.add_argument("-config", dest="CONFIG_FILE", default="config-sample.yml", help="Config file")
parser.add_argument("-per", dest="ITEMS_PER_FILE", default=-1, type=int, help="Number of items per file; -1 for automatic")
a = parser.parse_args()

config = tu.loadConfig(a.CONFIG_FILE)
itemFields = config["itemFields"] if "itemFields" in config else None

if itemFields is None:
    print(f'No item metadata fields are set in config. Skipping...')
    sys.exit()

OUTPUT_DIR = f'apps/{config["name"]}/'
OUTPUT_FILE_REL = "data/metadata/"
OUTPUT_FILE = OUTPUT_DIR + OUTPUT_FILE_REL
CONFIG_FILE = OUTPUT_DIR + "js/config/config.metadata.js"

# Make sure output dirs exist
io.makeDirectories([OUTPUT_FILE, CONFIG_FILE])
io.removeFiles(OUTPUT_FILE + "*.json")

items, categories = tu.getItems(config)
itemCount = len(items)

itemsPerFile = a.ITEMS_PER_FILE
if itemsPerFile < 1:
    targetFiles = 1000
    itemsPerFile = mu.roundInt(1.0 * itemCount / targetFiles)
    itemsPerFile = min(itemsPerFile, 1000)

totalFiles = mu.ceilInt(1.0 * itemCount / itemsPerFile)
print(f'{itemsPerFile} per file with a total of {totalFiles} files')

fileItems = []
fileIndex = 0
for i, item in enumerate(items):

    itemOut = []
    for field in itemFields:
        if field["column"] not in item:
            continue
        value = item[field["column"]]

        if str(value).strip() == "":
            continue

        fieldOut = field.copy()
        fieldOut["value"] = value
        fieldOut.pop("column", None)

        itemOut.append(fieldOut)

    fileItems.append(itemOut)
    if len(fileItems) >= itemsPerFile or i >= (itemCount-1):
        filenameOut = f'{OUTPUT_FILE}{fileIndex}.json'
        io.writeJSON(filenameOut, fileItems)
        fileIndex += 1
        fileItems = []

    mu.printProgress(i+1, itemCount)

outjson = {
    "metadata": {
        "itemCount": itemCount,
        "itemsPerFile": itemsPerFile,
        "itemsPath": OUTPUT_FILE_REL
    }
}

io.writeJSON(CONFIG_FILE, outjson, pretty=True, prepend="_.extend(CONFIG, ", append=");")

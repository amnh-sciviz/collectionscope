# -*- coding: utf-8 -*-

import argparse
import math
import os
import numpy as np
from pprint import pprint
import rasterfairy
import sys

import lib.io_utils as io
import lib.list_utils as lu
import lib.math_utils as mu

# input
parser = argparse.ArgumentParser()
parser.add_argument("-config", dest="CONFIG_FILE", default="config-sample.json", help="Config file")
a = parser.parse_args()

config = io.readJSON(a.CONFIG_FILE)
configMeta = config["metadata"]
configPos = config["positions"]

PRECISION = 4
INPUT_FILE = configMeta["src"]
ID_COLUMN = configMeta["id"]
OUTPUT_DIR = "apps/{appname}/".format(appname=config["name"])
OUTPUT_POS_DIR = OUTPUT_DIR + "data/positions/"
CONFIG_FILE = OUTPUT_DIR + "js/config/config.positions.js"

# Make sure output dirs exist
io.makeDirectories([OUTPUT_POS_DIR, CONFIG_FILE])
fieldnames, items = io.readCsv(INPUT_FILE, parseNumbers=False)
if "query" in configMeta:
    items = lu.filterByQueryString(items, configMeta["query"])
    print("%s items after filtering" % len(items))

# Sort so that index corresponds to ID
items = sorted(items, key=lambda item: item[ID_COLUMN])
itemCount = len(items)

jsonPositions = {}
for keyName, options in configPos.items():
    xCol = options["xCol"]
    yCol = options["yCol"]
    xys = [(mu.parseNumber(item[xCol]), mu.parseNumber(item[yCol])) for item in items]

    gridWidth = gridHeight = None

    if options["layout"] == "grid":
        gridRatioX, gridRatioY = (1, 1)
        if "gridAspectRatio" in options:
            gridRatioX, gridRatioY = tuple(mu.parseNumber(size) for size in options["gridAspectRatio"].split(":"))

        gridRatio = 1.0 * gridRatioX / gridRatioY
        gridWidth = math.ceil(math.sqrt(itemCount) * gridRatio)
        gridHeight = math.ceil(1.0 * itemCount / gridWidth)

        xys = np.array(xys)
        print("Determining grid assignment for (%s x %s) for grid size: %s x %s..." % (xCol, yCol, gridWidth, gridHeight))
        gridAssignment = rasterfairy.transformPointCloud2D(xys, target=(gridWidth, gridHeight))
        grid, gridShape = gridAssignment

        # flatten and normalize values between 0 and 1
        values = np.zeros(len(grid) * 2)
        for i, xy in enumerate(grid):
            x, y = xy
            values[i*2] = round(1.0 * x / gridWidth, PRECISION)
            values[i*2+1] = round(1.0 * y / gridHeight, PRECISION)
        values = values.tolist()

    else:
        # flatten and round
        nxys = addNormalizedValues(xys, 0, 0)
        nxys = addNormalizedValues(xys, 1, 1)
        values = np.zeros(len(nxys) * 2)
        for i, nxy in enumerate(nxys):
            nx, ny = nxy
            values[i*2] = round(nx, PRECISION)
            values[i*2+1] = round(ny, PRECISION)
        values = values.tolist()

    # Write position file
    posOutFile = OUTPUT_POS_DIR + keyName + ".json"
    io.writeJSON(posOutFile, values)
    jsonPositions[keyName] = {"src": "/" + posOutFile, "layout": options["layout"]}

    if gridWidth is not None:
        jsonPositions[keyName]["gridWidth"] = gridWidth
        jsonPositions[keyName]["gridHeight"] = gridHeight

# Write config file
outjson = {
    "positions": jsonPositions
}
io.writeJSON(CONFIG_FILE, outjson, pretty=True, prepend="_.extend(CONFIG, ", append=");")

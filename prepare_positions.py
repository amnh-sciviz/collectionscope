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
OUTPUT_POS_DIR_REL = "data/positions/"
OUTPUT_POS_DIR = OUTPUT_DIR + OUTPUT_POS_DIR_REL
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
dimensions = 2

jsonPositions = {}
for keyName, options in configPos.items():

    xys = [(0, 0) for item in items]
    if "yCol" in options:
        yCol = options["yCol"]
        # check for string values
        isStringValues = False
        if not mu.isNumeric(items[0][yCol]):
            isStringValues = True
            stringValueTable = lu.stringsToValueTable([item[yCol] for item in items])
        for i, item in enumerate(items):
            y = mu.parseNumber(item[yCol]) if not isStringValues else stringValueTable[item[yCol]]
            xys[i] = (xys[i][0], y)
    if "xCol" in options:
        xCol = options["xCol"]
        # check for string values
        isStringValues = False
        if not mu.isNumeric(items[0][xCol]):
            isStringValues = True
            stringValueTable = lu.stringsToValueTable([item[xCol] for item in items])
        for i, item in enumerate(items):
            x = mu.parseNumber(item[xCol]) if not isStringValues else stringValueTable[item[xCol]]
            xys[i] = (x, xys[i][1])


    gridWidth = gridHeight = None
    aspectRatioX, aspectRatioY = (1, 1)
    if "aspectRatio" in options:
        aspectRatioX, aspectRatioY = tuple(mu.parseNumber(size) for size in options["aspectRatio"].split(":"))
    aspectRatio = 1.0 * aspectRatioX / aspectRatioY

    posOutFile = OUTPUT_POS_DIR + keyName + ".json"
    posOutFileRel = OUTPUT_POS_DIR_REL + keyName + ".json"
    jsonPositions[keyName] = {"src": posOutFileRel, "layout": options["layout"]}

    if options["layout"] == "grid":
        gridWidth = math.ceil(math.sqrt(itemCount) * aspectRatio)
        gridHeight = math.ceil(1.0 * itemCount / gridWidth)

        xys = np.array(xys)
        print("Determining grid assignment for (%s x %s) for grid size: %s x %s..." % (xCol, yCol, gridWidth, gridHeight))
        gridAssignment = rasterfairy.transformPointCloud2D(xys, target=(gridWidth, gridHeight))
        grid, gridShape = gridAssignment

        # flatten and normalize values between 0 and 1
        values = np.zeros(len(grid) * dimensions)
        for i, xy in enumerate(grid):
            x, y = xy
            if "inverseY" in options:
                y = gridHeight - y
            values[i*dimensions] = round(1.0 * x / gridWidth, PRECISION)
            values[i*dimensions+1] = round(1.0 * y / gridHeight, PRECISION)
        values = values.tolist()

        jsonPositions[keyName]["gridWidth"] = gridWidth
        jsonPositions[keyName]["gridHeight"] = gridHeight

    elif options["layout"] == "spheres" or options["layout"] == "bars":
        dimensions = 3
        groups = lu.groupListByValue(xys)
        groups = [{"centerX": item[0][0], "centerY": item[0][1], "count": item[1]} for item in groups]
        groups = mu.addNormalizedValues(groups, "centerX", "nCenterX")
        groups = mu.addNormalizedValues(groups, "centerY", "nCenterY")
        # groups = mu.addNormalizedValues(groups, "count", "nCount")

        values = np.zeros(len(xys) * dimensions)
        itemIndex = 0
        for i, group in enumerate(groups):
            nCount = 1.0 * group["count"] / itemCount
            ncy = group["nCenterY"] if "yCol" in options else 0.5
            if "inverseY" in options:
                ncy = 1.0 - ncy
            if aspectRatio > 1.0 or aspectRatio < 1.0:
                ncy = mu.lerp((1.0/aspectRatio*0.5, 1.0-1.0/aspectRatio*0.5), ncy)
            center = (group["nCenterX"], ncy, nCount)
            for j in range(group["count"]):
                x, y, z = center
                values[itemIndex*dimensions] = round(x, PRECISION)
                values[itemIndex*dimensions+1] = round(y, PRECISION)
                values[itemIndex*dimensions+2] = round(z, PRECISION)
                itemIndex += 1

        values = values.tolist()

    else:
        # flatten and round
        nxys = mu.addNormalizedValues(xys, 0, 0)
        nxys = mu.addNormalizedValues(xys, 1, 1)
        values = np.zeros(len(nxys) * dimensions)
        for i, nxy in enumerate(nxys):
            nx, ny = nxy
            if "inverseY" in options:
                ny = 1.0 - ny
            ny = mu.lerp((1.0/aspectRatio*0.5, 1.0-1.0/aspectRatio*0.5), ny)
            values[i*dimensions] = round(nx, PRECISION)
            values[i*dimensions+1] = round(ny, PRECISION)
        values = values.tolist()

    # Write position file
    io.writeJSON(posOutFile, values)

# Write config file
outjson = {
    "positions": jsonPositions
}
io.writeJSON(CONFIG_FILE, outjson, pretty=True, prepend="_.extend(CONFIG, ", append=");")

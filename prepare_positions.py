# -*- coding: utf-8 -*-

import argparse
import math
import os
import numpy as np
from pprint import pprint
import rasterfairy
import sys

import lib.io_utils as io
import lib.item_utils as tu
import lib.list_utils as lu
import lib.math_utils as mu

# input
parser = argparse.ArgumentParser()
parser.add_argument("-config", dest="CONFIG_FILE", default="config-sample.json", help="Config file")
a = parser.parse_args()

config = io.readJSON(a.CONFIG_FILE)
configPos = config["positions"]

PRECISION = 7
OUTPUT_DIR = "apps/{appname}/".format(appname=config["name"])
OUTPUT_POS_DIR_REL = "data/positions/"
OUTPUT_POS_DIR = OUTPUT_DIR + OUTPUT_POS_DIR_REL
CONFIG_FILE = OUTPUT_DIR + "js/config/config.positions.js"

# Make sure output dirs exist
io.makeDirectories([OUTPUT_POS_DIR, CONFIG_FILE])

items = tu.getItems(config)
itemCount = len(items)
dimensions = 3

if len(items) < 1:
    print("No items found")
    sys.exit()

def parseCol(points, keyname, index, options):
    global items
    stringValueTable = None

    if keyname not in options:
        return (stringValueTable, points)

    col = options[keyname]
    isRandom = (col == "random")
    # check for string values
    isStringValues = False
    if not isRandom and not mu.isNumeric(items[0][col]):
        isStringValues = True
        stringValueTable = lu.stringsToValueTable([item[col] for item in items])
    for i, item in enumerate(items):
        if isRandom:
            value = mu.randomUniform(seed=i*index+3)
        else:
            value = mu.parseNumber(item[col]) if not isStringValues else stringValueTable[item[col]]
        points[i] = lu.updateTuple(points[i], index, value)

    return (stringValueTable, points)

jsonPositions = {}
for keyName, options in configPos.items():
    jsonPositions[keyName] = options.copy()

    # completely random; no need to export position data
    if "xCol" not in options and "yCol" not in options and "zCol" not in options:
        continue

    xyzs = [(0.5, 0.5, 0.5) for item in items]
    stringValueTableX, xyzs = parseCol(xyzs, "xCol", 0, options)
    stringValueTableY, xyzs = parseCol(xyzs, "yCol", 1, options)
    stringValueTableZ, xyzs = parseCol(xyzs, "zCol", 2, options)
    stringValueTables = [stringValueTableX, stringValueTableY, stringValueTableZ]

    gridWidth = gridHeight = None
    aspectRatioX, aspectRatioY = (1, 1)
    if "aspectRatio" in options:
        aspectRatioX, aspectRatioY = tuple(mu.parseNumber(size) for size in options["aspectRatio"].split(":"))
    aspectRatio = 1.0 * aspectRatioX / aspectRatioY

    posOutFile = OUTPUT_POS_DIR + keyName + ".json"
    posOutFileRel = OUTPUT_POS_DIR_REL + keyName + ".json"
    jsonPositions[keyName]["src"] = posOutFileRel

    if options["layout"] == "grid":
        dimensions = 2
        gridWidth = math.ceil(math.sqrt(itemCount) * aspectRatio)
        gridHeight = math.ceil(1.0 * itemCount / gridWidth)

        xyzs = np.array(xyzs)
        xys = xyzs[:, :-1]
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
        groups = lu.groupListByValue(xyzs)
        groups = [{"centerX": item[0][0], "centerY": item[0][1], "count": item[1]} for item in groups]
        groups = mu.addNormalizedValues(groups, "centerX", "nCenterX")
        groups = mu.addNormalizedValues(groups, "centerY", "nCenterY")
        # groups = mu.addNormalizedValues(groups, "count", "nCount")

        values = np.zeros(len(xyzs) * dimensions)
        itemIndex = 0
        for i, group in enumerate(groups):
            nCount = 1.0 * group["count"] / itemCount
            ncx = group["nCenterX"] if "xCol" in options else 0.5
            ncy = group["nCenterY"] if "yCol" in options else 0.5
            if "inverseY" in options:
                ncy = 1.0 - ncy
            if aspectRatio > 1.0:
                nhalf = 1.0/aspectRatio*0.5
                ncy = mu.lerp((0.5-nhalf, 0.5+nhalf), ncy)
            elif aspectRatio < 1.0:
                nhalf = aspectRatio*0.5
                ncx = mu.lerp((0.5-nhalf, 0.5+nhalf), ncx)
            center = (ncx, ncy, nCount)
            for j in range(group["count"]):
                x, y, z = center
                values[itemIndex*dimensions] = round(x, PRECISION)
                values[itemIndex*dimensions+1] = round(y, PRECISION)
                values[itemIndex*dimensions+2] = round(z, PRECISION)
                itemIndex += 1

        values = values.tolist()

    elif options["layout"] == "tunnel":
        values = [xyz[2] for xyz in xyzs]
        minValue = min(values)
        maxValue = max(values)
        isIntegerValues = mu.isInteger(minValue)
        if isIntegerValues:
            print("Treating %s as integer values" % options["zCol"])
        else:
            print("Treating %s as float values" % options["zCol"])
        nUnit = None
        if isIntegerValues:
            maxValue += 1
            nUnit = 1.0 / (maxValue-minValue) # only relevant for integers; treat each integer as a unit
        groups = lu.groupList(xyzs, 2) # group by z col
        groups = sorted(groups, key=lambda group: group["2"])
        nThickness = 0.2 if "thickness" not in options else options["thickness"]
        count = 0
        values = np.zeros(len(xyzs) * dimensions)
        for i, group in enumerate(groups):
            minZ = maxZ = None
            if nUnit is not None:
                minZ = mu.norm(group["2"], (minValue, maxValue))
                maxZ = minZ + nUnit
            for j, item in enumerate(group["items"]):
                x, y, z = item
                if minZ is not None and maxZ is not None:
                    z = mu.randomUniform(minZ, maxZ, seed=count+5)
                else:
                    z = mu.norm(group["2"], (minValue, maxValue))
                angle =  mu.randomUniform(0, 360, seed=count+7)
                distance =  mu.randomUniform(0.5-nThickness, 0.5, seed=count+9)
                x, y =  mu.translatePoint(x, y, distance, angle)
                values[count*dimensions] = round(x, PRECISION)
                values[count*dimensions+1] = round(y, PRECISION)
                values[count*dimensions+2] = round(z, PRECISION)
                count += 1
        values = values.tolist()

    else:
        # flatten and round
        nxyzs = mu.addNormalizedValues(xyzs, 0, 0)
        nxyzs = mu.addNormalizedValues(xyzs, 1, 1)
        nxyzs = mu.addNormalizedValues(xyzs, 2, 2)
        values = np.zeros(len(nxyzs) * dimensions)
        for i, nxyz in enumerate(nxyzs):
            nx, ny, nz = nxyz
            if "inverseY" in options:
                ny = 1.0 - ny
            ny = mu.lerp((1.0/aspectRatio*0.5, 1.0-1.0/aspectRatio*0.5), ny)
            values[i*dimensions] = round(nx, PRECISION)
            values[i*dimensions+1] = round(ny, PRECISION)
            values[i*dimensions+2] = round(nz, PRECISION)
        values = values.tolist()

    # Write position file
    io.writeJSON(posOutFile, values)

    # Parse labels if config is set
    if "labels" in options:
        pCols = ["xCol", "yCol", "zCol"]
        colName = options["labels"]
        if colName not in pCols:
            print("labels must be one of: " + ", ".join(pCols))
            continue
        dimensionIndex = pCols.index(colName)
        stringValueTable = stringValueTables[dimensionIndex]
        isStringValues = stringValueTable is not None

        values = [xyz[dimensionIndex] for xyz in xyzs]
        if not mu.isInteger(values[0]):
            print("%s is not a string or integer, parsing as integers" % colName)
            values = [int(v) for v in values]

        valueCount = len(values)
        if valueCount < 1:
            print("No labels found")
            continue
        minValue, maxValue = (min(values), max(values)+1)
        # fill in missing integers
        allValues = []
        for j in range(maxValue-minValue):
            allValues.append(minValue+j)
        labels = []
        step = 1.0 / (maxValue-minValue)
        for j, value in enumerate(allValues):
            position = [0.5, 0.5, 0.5]
            if "defaultLabelPosition" in options:
                position = options["defaultLabelPosition"][:]
            posValue = mu.norm(value, (minValue, maxValue)) + step*0.5 # place label at the center of each step
            position[dimensionIndex] = round(posValue, PRECISION)
            text = value
            if isStringValues:
                text = lu.getKeyByValue(stringValueTable, value)
            labels.append({
                "text": str(text),
                "position": position
            })
        jsonPositions[keyName]["labels"] = labels

# Write config file
outjson = {
    "positions": jsonPositions
}
io.writeJSON(CONFIG_FILE, outjson, pretty=True, prepend="_.extend(CONFIG, ", append=");")

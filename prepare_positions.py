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
configViews = config["views"]
layouts = lu.unique([view["layout"] for key, view in configViews.items()])

PRECISION = 5
OUTPUT_DIR = "apps/{appname}/".format(appname=config["name"])
OUTPUT_POS_DIR_REL = "data/positions/"
OUTPUT_POS_DIR = OUTPUT_DIR + OUTPUT_POS_DIR_REL
CONFIG_FILE = OUTPUT_DIR + "js/config/config.positions.js"

# Make sure output dirs exist
io.makeDirectories([OUTPUT_POS_DIR, CONFIG_FILE])

# Remove existing data
io.removeFiles(OUTPUT_POS_DIR + "*.json")

sets, items = tu.getItems(config)
itemCount = len(items)
dimensions = 3

if len(items) < 1:
    print("No items found")
    sys.exit()

def getTimelineTunnelLayout(userOptions={}):
    global items

    options = {
        "thickness": 0.2
    }
    options.update(userOptions)

    cfg = {}
    yearCol = "year"
    dimensions = 3

    if yearCol not in items[0]:
        print("Could not find column %s in items, please add this column to metadata cols with 'type' = 'int'" % yearCol)
        sys.exit()

    years = [item[yearCol] for item in items]
    minYear = min(years)
    maxYear = max(years) + 1
    nUnit = 1.0 / (maxYear-minYear)
    groups = lu.groupList(items, yearCol) # group by year
    groups = sorted(groups, key=lambda group: group[yearCol])
    nThickness = options["thickness"]
    count = 0
    values = np.zeros(len(items) * dimensions)

    for i, group in enumerate(groups):
        minZ = mu.norm(group[yearCol], (minYear, maxYear))
        maxZ = minZ + nUnit
        for j, item in enumerate(group["items"]):
            index = item["index"]
            x = y = 0.5
            z = mu.randomUniform(minZ, maxZ, seed=count+5)
            angle =  mu.randomUniform(0, 360, seed=count+7)
            distance =  mu.randomUniform(0.5-nThickness, 0.5, seed=count+9)
            x, y =  mu.translatePoint(x, y, distance, angle)
            values[count*dimensions] = round(x, PRECISION)
            values[count*dimensions+1] = round(y, PRECISION)
            values[count*dimensions+2] = round(z, PRECISION)
            count += 1
    values = values.tolist()
    return (cfg, values)

def getSphereCategoryTimelineLayout(userOptions={}):
    global items
    global sets
    cfg = {
        "layout": "spheres"
    }

    categoryCol = "category"
    yearCol = "year"
    if yearCol not in items[0]:
        print("Could not find column %s in items, please add this column to metadata cols with 'type' = 'int'" % yearCol)
        sys.exit()
    if categoryCol not in sets:
        print("Could not find column %s in sets, please add this column to metadata cols with 'asIndex' = true" % categoryCol)
        sys.exit()

    categorySet = sets[categoryCol]
    categoryCount = len(categorySet)
    dimensions = 3
    groups = lu.groupList(items, yearCol) # group by year
    groups = sorted(groups, key=lambda group: group[yearCol])
    years = [item[yearCol] for item in items]
    minYear = min(years)
    maxYear = max(years) + 1
    nUnit = 1.0 / (maxYear-minYear)

    # determine category sphere count range
    minCount = 9999999999
    maxCount = 0
    for i, group in enumerate(groups):
        subgroups = lu.groupList(group["items"], categoryCol) # group by category
        for subgroup in subgroups:
            minCount = min(minCount, subgroup["count"])
            maxCount = max(maxCount, subgroup["count"])
        groups[i]["categoryGroups"] = subgroups

    # assign position values
    values = np.zeros(len(items) * dimensions)
    for i, group in enumerate(groups):
        z = mu.norm(group[yearCol], (minYear, maxYear)) + nUnit*0.5 # place spheres in the center of the year
        subgroups = group["categoryGroups"]
        subgroupLookup = lu.createLookup(subgroups, categoryCol)
        for j, category in enumerate(categorySet):
            x = 1.0 - 1.0 * j / (categoryCount-1)
            categoryKey = str(j)
            if categoryKey in subgroupLookup:
                subgroup = subgroupLookup[categoryKey]
                y = mu.norm(subgroup["count"], (minCount, maxCount))
                y = mu.lerp((0.01, 1.0), y)
                for catItem in subgroup["items"]:
                    itemIndex = catItem["index"]
                    values[itemIndex*dimensions] = round(x, PRECISION)
                    values[itemIndex*dimensions+1] = round(y, PRECISION)
                    values[itemIndex*dimensions+2] = round(z, PRECISION)

    values = values.tolist()
    return (cfg, values)

def getGeographyBarsLayout(userOptions={}):
    global items
    cfg = {
        "layout": "bars"
    }

    latCol = "lat"
    lonCol = "lon"
    if latCol not in items[0] or lonCol not in items[0]:
        print("Could not find column (%s, %s) in items, please add these columns to metadata cols with 'type' = 'float'" % (lonCol, latCol))
        sys.exit()

    # create unique key for lat lon
    for i, item in enumerate(items):
        items[i]["lonLatKey"] = (mu.roundInt(item[lonCol]*PRECISION), mu.roundInt(item[latCol]*PRECISION))

    latRange = (90.0, -90.0)
    lonRange = (-180.0, 180.0)
    dimensions = 3
    groups = lu.groupList(items, "lonLatKey") # group by lat lon
    counts = [group["count"] for group in groups]
    minCount, maxCount = (min(counts), max(counts))

    # assign position values
    values = np.zeros(len(items) * dimensions)
    for group in groups:
        y = mu.norm(group["count"], (minCount, maxCount))
        y = mu.lerp((0.01, 1.0), y)
        for item in group["items"]:
            itemIndex = item["index"]
            x = 1.0 - mu.norm(item[lonCol], lonRange)
            z = 1.0 - mu.norm(item[latCol], latRange)
            values[itemIndex*dimensions] = round(x, PRECISION)
            values[itemIndex*dimensions+1] = round(y, PRECISION)
            values[itemIndex*dimensions+2] = round(z, PRECISION)

    values = values.tolist()
    return (cfg, values)

jsonPositions = {}
for layout in layouts:
    layoutConfig = {}
    layoutData = None

    if layout == "timelineTunnel":
        layoutConfig, layoutData = getTimelineTunnelLayout()

    elif layout == "sphereCategoryTimeline":
        layoutConfig, layoutData = getSphereCategoryTimelineLayout()

    elif layout == "geographyBars":
        layoutConfig, layoutData = getGeographyBarsLayout()

    else:
        layout = "randomSphere"
        layoutData = None
        layoutConfig["layout"] = "spheres"
        print("Using default layout %s" % layout)

    # Write position file
    if layoutData is not None:
        posOutFile = OUTPUT_POS_DIR + layout + ".json"
        io.writeJSON(posOutFile, layoutData)
        layoutConfig["src"] = OUTPUT_POS_DIR_REL + layout + ".json"

    jsonPositions[layout] = layoutConfig

# Write config file
outjson = {
    "positions": jsonPositions
}
io.writeJSON(CONFIG_FILE, outjson, pretty=True, prepend="_.extend(CONFIG, ", append=");")

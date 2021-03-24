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
parser.add_argument("-config", dest="CONFIG_FILE", default="config-sample.yml", help="Config file")
a = parser.parse_args()

config = tu.loadConfig(a.CONFIG_FILE)
configViews = config["visualizations"]
configStories = config["stories"]
layouts = configViews.keys()

PRECISION = 5
OUTPUT_DIR = "apps/{appname}/".format(appname=config["name"])
OUTPUT_POS_DIR_REL = "data/positions/"
OUTPUT_POS_DIR = OUTPUT_DIR + OUTPUT_POS_DIR_REL
CONFIG_FILE = OUTPUT_DIR + "js/config/config.positions.js"

# Make sure output dirs exist
io.makeDirectories([OUTPUT_POS_DIR, CONFIG_FILE])

# Remove existing data
io.removeFiles(OUTPUT_POS_DIR + "*.json")

items, categories = tu.getItems(config)
itemCount = len(items)
dimensions = 3

# Check for story ids
itemIdsWithStory = []
for key, story in configStories.items():
    if "itemId" in story:
        itemIdsWithStory.append(str(story["itemId"]))
itemIdsWithStory = set(itemIdsWithStory)

if len(items) < 1:
    print("No items found")
    sys.exit()

def itemHasStory(item):
    global itemIdsWithStory
    if item["_id"] in itemIdsWithStory:
        return True
    return False

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
        print("`dateColumn` needs to be set in config yml to support timelineTunnel layout")
        return (False, False)

    years = [item[yearCol] for item in items]
    minYear = min(years)
    maxYear = max(years) + 1
    nUnit = 1.0 / (maxYear-minYear)
    groups = lu.groupList(items, yearCol) # group by year
    groups = sorted(groups, key=lambda group: group[yearCol])
    nThickness = options["thickness"]
    minDistance = 0.5-nThickness
    maxDistance = 0.5
    count = 0
    values = np.zeros(len(items) * dimensions)

    for i, group in enumerate(groups):
        minZ = mu.norm(group[yearCol], (minYear, maxYear))
        maxZ = minZ + nUnit
        for j, item in enumerate(group["items"]):
            index = item["index"]
            x = y = 0.5
            z = mu.randomUniform(minZ, maxZ, seed=count+5)
            # angle =  mu.randomUniform(0, 360, seed=count+7)
            angle =  mu.randomUniform(-240, 60, seed=count+7)

            distance =  mu.randomUniform(minDistance, maxDistance, seed=count+9)
            # ensure story items are visible
            if itemHasStory(item):
                distance = minDistance * 0.8
            x, y =  mu.translatePoint(x, y, distance, angle)
            values[index*dimensions] = round(x, PRECISION)
            values[index*dimensions+1] = round(y, PRECISION)
            values[index*dimensions+2] = round(z, PRECISION)
            count += 1
    values = values.tolist()
    return (cfg, values)

def getSphereCategoryTimelineLayout(userOptions={}):
    global items
    global categories
    cfg = {
        "layout": "spheres"
    }

    categoryCol = "category"
    yearCol = "year"
    if yearCol not in items[0]:
        print("`dateColumn` needs to be set in config yml to support timelineTracks layout")
        return (False, False)

    if categoryCol not in items[0]:
        print("`groupByColumn` needs to be set in config yml to support timelineTracks layout")
        return (False, False)

    categoryCount = len(categories)
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
        for j, category in enumerate(categories):
            x = 1.0 - 1.0 * j / (categoryCount-1)
            categoryKey = category["text"]
            if categoryKey in subgroupLookup:
                subgroup = subgroupLookup[categoryKey]
                y = mu.norm(subgroup["count"], (minCount, maxCount))
                y = mu.lerp((0.01, 1.0), y)
                for catItem in subgroup["items"]:
                    itemIndex = catItem["index"]
                    cy = y
                    # a bit of a hack to ensure highighted items are visible
                    if itemHasStory(catItem):
                        cy = y + 1.25
                    values[itemIndex*dimensions] = round(x, PRECISION)
                    values[itemIndex*dimensions+1] = round(cy, PRECISION)
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
        print("`latitudeColumn` and `latitudeColumn` need to be set in config yml to support geographyBars layout")
        return (False, False)

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
            itemY = y
            # a bit of a hack to ensure highighted items are visible
            if itemHasStory(item):
                itemY = y + 1.05
            values[itemIndex*dimensions] = round(x, PRECISION)
            values[itemIndex*dimensions+1] = round(itemY, PRECISION)
            values[itemIndex*dimensions+2] = round(z, PRECISION)

    values = values.tolist()
    return (cfg, values)

jsonPositions = {}
for layout in layouts:
    layoutConfig = {}
    layoutData = None

    if layout == "timelineTunnel":
        layoutConfig, layoutData = getTimelineTunnelLayout()

    elif layout == "timelineTracks":
        layoutConfig, layoutData = getSphereCategoryTimelineLayout()

    elif layout == "geographyBars":
        layoutConfig, layoutData = getGeographyBarsLayout()

    else:
        layout = "randomSphere"
        layoutData = False
        layoutConfig["layout"] = "spheres"
        print("Using default layout %s" % layout)

    # Write position file
    if layoutData is not False:
        posOutFile = OUTPUT_POS_DIR + layout + ".json"
        io.writeJSON(posOutFile, layoutData)
        layoutConfig["src"] = OUTPUT_POS_DIR_REL + layout + ".json"

    if layoutConfig is not False:
        jsonPositions[layout] = layoutConfig

# Write config file
outjson = {
    "positions": jsonPositions
}
io.writeJSON(CONFIG_FILE, outjson, pretty=True, prepend="_.extend(CONFIG, ", append=");")

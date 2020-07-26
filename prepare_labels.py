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
configLabels = config["labels"]

PRECISION = 5
OUTPUT_DIR = "apps/{appname}/".format(appname=config["name"])
OUTPUT_LABEL_DIR_REL = "data/labels/"
OUTPUT_LABEL_DIR = OUTPUT_DIR + OUTPUT_LABEL_DIR_REL
CONFIG_FILE = OUTPUT_DIR + "js/config/config.labels.js"

# Make sure output dirs exist
io.makeDirectories([OUTPUT_LABEL_DIR, CONFIG_FILE])

# Remove existing data
io.removeFiles(OUTPUT_LABEL_DIR + "*.json")

sets, items = tu.getItems(config)
itemCount = len(items)

def getYearLabels(userOptions={}):
    global items
    cfg = {}
    options = {
        "y": 0.667
    }
    options.update(userOptions)
    yearCol = "year"
    if yearCol not in items[0]:
        print("Could not find column %s in items, please add this column to metadata cols with 'type' = 'int'" % yearCol)
        sys.exit()

    years = [item[yearCol] for item in items]
    minYear = min(years)
    maxYear = max(years) + 1
    nUnit = 1.0 / (maxYear-minYear)

    labels = []
    for i in range(maxYear-minYear):
        x = 0.5
        y = options["y"]
        year = minYear + i
        z = mu.norm(year, (minYear, maxYear)) + nUnit*0.5 # center
        labels += [round(x, PRECISION), round(y, PRECISION), round(z, PRECISION), year]

    return (cfg, labels)

def getCategoryYearLabels(userOptions={}):
    global items
    global sets

    cfg = {}
    options = {
        "y": 0.667,
        "labelEveryYearUnit": 5
    }
    options.update(userOptions)
    yearCol = "year"
    categoryCol = "category"
    if yearCol not in items[0]:
        print("Could not find column %s in items, please add this column to metadata cols with 'type' = 'int'" % yearCol)
        sys.exit()
    if categoryCol not in sets:
        print("Could not find column %s in sets, please add this column to metadata cols with 'asIndex' = true" % categoryCol)
        sys.exit()

    categorySet = sets[categoryCol]
    categoryCount = len(categorySet)

    years = [item[yearCol] for item in items]
    minYear = min(years)
    maxYear = max(years) + 1
    nUnit = 1.0 / (maxYear-minYear)

    labels = []
    for i in range(maxYear-minYear):
        year = minYear + i
        if year % options["labelEveryYearUnit"] > 0:
            continue

        y = options["y"]
        z = mu.norm(year, (minYear, maxYear)) # beginning of year

        for j, category in enumerate(categorySet):
            x = 1.0 - 1.0 * j / (categoryCount-1)
            labels += [round(x, PRECISION), round(y, PRECISION), round(z, PRECISION), category]

    return (cfg, labels)

def getCountryLabels(userOptions={}):
    global items
    global sets

    cfg = {}
    options = {
        "y": 0.5
    }
    options.update(userOptions)

    countryCol = "country"
    latCol = "lat"
    lonCol = "lon"
    if countryCol not in items[0] or countryCol not in sets:
        print("Could not find column %s in items, please add this column to metadata cols with 'asIndex' = true" % countryCol)
        sys.exit()
    if latCol not in items[0] or lonCol not in items[0]:
        print("Could not find column (%s, %s) in items, please add these columns to metadata cols with 'type' = 'float'" % (lonCol, latCol))
        sys.exit()

    latRange = (90.0, -90.0)
    lonRange = (-180.0, 180.0)
    countrySet = sets[countryCol]
    groups = lu.groupList(items, countryCol) # group by country
    counts = [group["count"] for group in groups]
    minCount, maxCount = (min(counts), max(counts))
    labels = []
    for group in groups:
        firstItem = group["items"][0]
        label = countrySet[int(group[countryCol])]
        lon = firstItem[lonCol]
        lat = firstItem[latCol]
        y = options["y"]
        x = 1.0 - mu.norm(lon, lonRange)
        z = 1.0 - mu.norm(lat, latRange)
        # HACK: offset z slightly to acommodate size of bar
        w = mu.norm(group["count"], (minCount, maxCount))
        w = mu.lerp((0.01, 1.0), w)
        # assume height is half the depth; divide by 6 for radius calculation (see geometry.js)
        radius = 0.5 / 6.0 * w + 0.005
        z = z - radius
        labels += [round(x, PRECISION), round(y, PRECISION), round(z, PRECISION), label]

    return (cfg, labels)

jsonLabels = {}
for labelKey, labelOptions in configLabels.items():
    labelConfig = labelOptions.copy()
    labelData = None

    if labelKey == "years":
        _labelConfig, labelData = getYearLabels()
        labelConfig.update(_labelConfig)

    elif labelKey == "categoryYears":
        _labelConfig, labelData = getCategoryYearLabels()
        labelConfig.update(_labelConfig)

    elif labelKey == "countries":
        _labelConfig, labelData = getCountryLabels()
        labelConfig.update(_labelConfig)

    else:
        print("Invalid label key: %s" % labelKey)
        continue

    # Write position file
    if labelData is not None:
        labelOutFile = OUTPUT_LABEL_DIR + labelKey + ".json"
        io.writeJSON(labelOutFile, labelData)
        labelConfig["src"] = OUTPUT_LABEL_DIR_REL + labelKey + ".json"
    else:
        continue

    jsonLabels[labelKey] = labelConfig

# Write config file
outjson = {
    "labels": jsonLabels
}
io.writeJSON(CONFIG_FILE, outjson, pretty=True, prepend="_.extend(CONFIG, ", append=");")

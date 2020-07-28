# -*- coding: utf-8 -*-

import argparse
import math
import os
from pprint import pprint
import sys

import lib.io_utils as io
import lib.list_utils as lu
import lib.item_utils as tu
import lib.math_utils as mu

# input
parser = argparse.ArgumentParser()
parser.add_argument("-config", dest="CONFIG_FILE", default="config-sample.json", help="Config file")
parser.add_argument("-keys", dest="KEY_LIST", default="views,content,ui,menus,keys,overlays", help="Keys that should be included in config")
a = parser.parse_args()

config = io.readJSON(a.CONFIG_FILE)

sets, items = tu.getItems(config)

OUTPUT_FILE = "apps/{appname}/js/config/config.content.js".format(appname=config["name"])
KEY_LIST =  [k.strip() for k in a.KEY_LIST.split(",")]
PRECISION = 5

io.makeDirectories([OUTPUT_FILE])

def getCategoryTimelineHotspot(view, content):
    global items
    global sets

    year = None

    if "year" in content:
        year = content["year"]
    elif "visibleTimeRange" in content:
        year = mu.roundInt(mu.lerp(tuple(content["visibleTimeRange"]), 0.5))

    if year is None:
        print("Need to set year or time range in content")
        return None

    yearCol = "year"
    if yearCol not in items[0]:
        print("Could not find column %s in items, please add this column to metadata cols with 'type' = 'int'" % yearCol)
        return None
    years = [item[yearCol] for item in items]
    minYear = min(years)
    maxYear = max(years) + 1
    nUnit = 1.0 / (maxYear-minYear)

    if "category" not in sets:
        print("Could not find column 'category' in sets")
        return None

    categories = sets["category"]
    if "category" not in content:
        print("Could not find column 'category' in content")
        return None
    if content["category"] not in categories:
        print("Could not find %s in categories" % content["category"])
        return None

    categoryCount = len(categories)
    categoryIndex = categories.index(content["category"])

    # place at in the center of the year
    z = mu.norm(year, (minYear, maxYear)) + nUnit*0.5
    # place at center of region
    x = 1.0 - 1.0 * categoryIndex / (categoryCount-1)
    # place at top of bounds
    y = 0.0
    return {
        "x":  round(x, PRECISION),
        "y":  round(y, PRECISION),
        "z":  round(z, PRECISION)
    }

def getTimelineValues():
    global items

    yearCol = "year"
    if yearCol not in items[0]:
        print("Could not find column %s in items, please add this column to metadata cols with 'type' = 'int'" % yearCol)
        sys.exit()

    years = [item[yearCol] for item in items]
    minYear = min(years)
    maxYear = max(years)
    totalYears = maxYear - minYear + 1

    groups = lu.groupList(items, yearCol) # group by year
    yearDataLookup = lu.createLookup(groups, yearCol)

    items = []
    for i in range(totalYears):
        year = i + minYear
        yearKey = str(year)
        count = 0
        if yearKey in yearDataLookup:
            count = yearDataLookup[yearKey]["count"]
        items.append({
            "year": year,
            "value": count
        })
    return items

# check to see if we should make a menu from a property set
if "menus" in config:
    for menuKey, menu in config["menus"].items():
        # check to see if we should make a menu from a property set
        if "property" in menu and "items" not in menu and menu["property"] in sets:
            keyName = "items" if "type" not in menu else menu["type"]
            items = [{
                "label": "All",
                "name": "filter-"+menu["property"],
                "value": -1,
                "checked": True
            }]
            propSet = sets[menu["property"]]
            for index, prop in enumerate(propSet):
                items.append({
                    "label": prop,
                    "name": "filter-"+menu["property"],
                    "value": index
                })
            config["menus"][menuKey][keyName] = items

# generate labels for timeline key
if "keys" in config:
    for keyValue, keyOptions in config["keys"].items():
        if keyOptions["type"] == "timeline":
            timelineValues = getTimelineValues()
            config["keys"][keyValue]["items"] = timelineValues

# create hotspots for stories
if "views" in config and "content" in config:
    for viewKey, view in config["views"].items():
        if "content" not in view:
            continue

        hotspots = {}
        valid = False
        for contentKey in view["content"]:
            hotspot = {}
            if contentKey not in config["content"]:
                continue

            if view["layout"] == "sphereCategoryTimeline":
                hotspot = getCategoryTimelineHotspot(view, config["content"][contentKey])
                if hotspot is not None:
                    hotspots[contentKey] = hotspot
                    valid = True

        if valid:
            config["views"][viewKey]["hotspots"] = hotspots

outjson = {}
for key in KEY_LIST:
    if key not in config:
        print("Warning: %s does not exist in %s" % (key, a.CONFIG_FILE))
        continue

    outjson[key] = config[key]


io.writeJSON(OUTPUT_FILE, outjson, pretty=True, prepend="_.extend(CONFIG, ", append=");")

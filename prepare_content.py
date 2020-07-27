# -*- coding: utf-8 -*-

import argparse
import math
import os
from pprint import pprint
import sys

import lib.io_utils as io
import lib.list_utils as lu
import lib.item_utils as tu

# input
parser = argparse.ArgumentParser()
parser.add_argument("-config", dest="CONFIG_FILE", default="config-sample.json", help="Config file")
parser.add_argument("-keys", dest="KEY_LIST", default="views,content,ui", help="Keys that should be included in config")
a = parser.parse_args()

config = io.readJSON(a.CONFIG_FILE)

sets, items = tu.getItems(config)

OUTPUT_FILE = "apps/{appname}/js/config/config.content.js".format(appname=config["name"])
KEY_LIST =  [k.strip() for k in a.KEY_LIST.split(",")]

io.makeDirectories([OUTPUT_FILE])

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

outjson = {}
for key in KEY_LIST:
    if key not in config:
        print("Warning: %s does not exist in %s" % (key, a.CONFIG_FILE))

    c = config[key]

    if key == "ui" and "menus" in c:
        for menuKey, menu in c["menus"].items():

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
                c["menus"][menuKey][keyName] = items

    if key == "ui" and "keys" in c:

        for keyValue, keyOptions in c["keys"].items():

            # generate labels for timeline
            if keyOptions["type"] == "timeline":

                timelineValues = getTimelineValues()
                c["keys"][keyValue]["items"] = timelineValues

    outjson[key] = c


io.writeJSON(OUTPUT_FILE, outjson, pretty=True, prepend="_.extend(CONFIG, ", append=");")

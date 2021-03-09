# -*- coding: utf-8 -*-

import argparse
import math
import os
from PIL import Image, ImageDraw
from pprint import pprint
import sys

import lib.io_utils as io
import lib.list_utils as lu
import lib.item_utils as tu
import lib.math_utils as mu

# input
parser = argparse.ArgumentParser()
parser.add_argument("-config", dest="CONFIG_FILE", default="config-sample.yml", help="Config file")
a = parser.parse_args()

config = tu.loadConfig(a.CONFIG_FILE)
items, categories = tu.getItems(config)
categoryCount = len(categories)

OUTPUT_FILE = "apps/{appname}/js/config/config.content.js".format(appname=config["name"])
PRECISION = 5

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

    timelineItems = []
    for i in range(totalYears):
        year = i + minYear
        yearKey = str(year)
        count = 0
        if yearKey in yearDataLookup:
            count = yearDataLookup[yearKey]["count"]
        timelineItems.append({
            "year": year,
            "value": count
        })
    return timelineItems

def makeCategoryTrackOverlay(filename, width=2048, lineThickness=4):
    global categories

    categoryCount = len(categories)

    if categoryCount < 1:
        return

    height = width
    baseImg = Image.new(mode="RGB", size=(width, height), color=(255, 255, 255))
    draw = ImageDraw.Draw(baseImg)

    barWidth = (width - (categoryCount-1) * lineThickness) / categoryCount
    for i, cat in enumerate(categories):
        x0 = mu.roundInt(i * (barWidth + lineThickness))
        x1 = mu.roundInt(x0 + barWidth)
        y0 = 0
        y1 = height
        if i >= (categoryCount-1):
            x1 = width
        draw.rectangle([x0, y0, x1, y1], fill=cat["color"])

    baseImg.save(filename)

outjson = {}

# Generate keys
keys = {}
# Map key
keys["map"] = {
    "type": "map",
    "image": "../../"+config["baseMapKey"]
}
# Timeline key
timelineValues = getTimelineValues()
yearCount = len(timelineValues)
keys["years"] = {
    "type": "timeline",
    "items": timelineValues
}
# Category key
keys["categories"] = {
    "type": "legend",
    "parent": "#top-right-ui",
    "items": categories
}
outjson["keys"] = keys

# Generate content/Stories
validStories = {}
if "stories" in config:

    itemLookup = lu.createLookup(items, "_id")

    stories = config["stories"]
    for key, story in stories.items():

        # determine which item to highlight for this story
        hotspotItemIndex = -1
        if "itemId" in story and story["itemId"] in itemLookup:
            hotspotItemIndex = itemLookup[story["itemId"]]["index"]

        else:
            # retrieve the story-specific items
            storyItems = lu.filterByQueryString(items, story["query"]) if "query" in story else items[:]
            # limit the results if specified
            if "limit" in story and len(storyItems) > story["limit"]:
                storyItems = storyItems[:story["limit"]]
            # Take the first item
            if len(storyItems) > 0:
                hotspotItemIndex = storyItems[0]["index"]

        if hotspotItemIndex >= 0:
            story['hotspotItemIndex'] = hotspotItemIndex
            validStories[key] = story
        else:
            print(f'Warning: no item found for story `{key}`; skipping...')

    outjson["stories"] = validStories

# Generate views/visualizations
visualizations = config["visualizations"]
for key, options in visualizations.items():

    options["layout"] = key

    # Do some layout calculations based on visualization type
    if key == "randomSphere":
        radius = options["radius"]
        diameter = options["radius"] * 2
        options["width"] = diameter
        options["height"] = diameter
        options["depth"] = diameter
        options["cameraPosition"] = [0, 0, -radius/8]
        options["bounds"] = [-radius, radius, -radius, radius]

    elif key == "timelineTunnel":
        radius = options["radius"]
        depthPerYear = options["depthPerYear"]
        depth = depthPerYear * yearCount
        options["keys"] = ["years"]
        options["labels"] = ["years"]
        options["width"] = radius * 2
        options["height"] = radius * 2
        options["depth"] = depth
        options["cameraPosition"] = [0, 0, -depth/4]
        options["bounds"] = [-radius, radius, -depth/2, depth/2]

    elif key == "geographyBars":
        options["keys"] = ["map"]
        options["labels"] = ["countries"]
        options["width"] = options["mapWidth"]
        options["height"] = options["barHeight"]
        options["depth"] = options["mapWidth"] / 2
        options["cameraPosition"] = [0, options["barHeight"]/8, -options["mapWidth"]/8]
        options["bounds"] = [-options["width"]/2, options["width"]/2, -options["depth"]/2, options["depth"]/2]
        options["overlays"] = [{
          "type": "plane",
          "width": options["width"], "height": options["depth"],
          "image": "../../"+config["baseMap"],
          "offset": [0, -20, 0]
        }]

    elif key == "timelineTracks":
        depthPerYear = options["depthPerYear"]
        depth = depthPerYear * yearCount
        width = options["trackWidth"] * categoryCount
        options["labels"] = ["years", "categoryYears"]
        options["keys"] = ["years", "categories"]
        options["width"] = width - options["trackWidth"]
        options["height"] = options["trackHeight"]
        options["depth"] = depth
        options["cameraPosition"] = [0, options["trackHeight"]/2, -depth/4]
        options["bounds"] = [-width/4, width/4, -depth/2, depth/2]
        overlayRelativePath = "img/categories.png"
        overlayFullPath = f'apps/{config["name"]}/' + overlayRelativePath
        makeCategoryTrackOverlay(overlayFullPath)
        options["overlays"] = [{
            "type": "plane",
            "width": width, "height": depth,
            "image": overlayRelativePath,
            "offset": [0, -options["trackHeight"]/4, 0]
        }]

    visualizations[key] = options
outjson["views"] = visualizations

# Generate UI
outjson["ui"] = config["animation"]

# Generate menus
viewOptions = [
  {"name": "change-view", "value": "randomSphere", "label": "Random", "checked": True},
  {"name": "change-view", "value": "timelineTunnel", "label": "Time tunnel"},
  {"name": "change-view", "value": "geographyBars", "label": "Map"},
  {"name": "change-view", "value": "timelineTracks", "label": "Race track"}
]
viewOptions = [view for view in viewOptions if view["value"] in visualizations]
outjson["menus"] = {
    "viewOptions": {
      "id": "radio-buttons-views",
      "type": "radioItems",
      "label": "Choose your layout",
      "className": "radio-buttons radio-buttons-views",
      "default": True,
      "radioItems": viewOptions
    }
}

io.writeJSON(OUTPUT_FILE, outjson, pretty=True, prepend="_.extend(CONFIG, ", append=");")

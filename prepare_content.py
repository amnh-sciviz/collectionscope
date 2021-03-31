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
import lib.string_utils as su

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
    "parent": "#legend-container",
    "items": categories
}
yearRange = [timelineValues[0]["year"], timelineValues[-1]["year"]]
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

        if "slides" in story:
            for j, slide in enumerate(story["slides"]):
                if "itemId" in slide:
                    story["slides"][j]["itemIndex"] = itemLookup[slide["itemId"]]["index"]

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
        options["mode"] = "firstPerson"
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
        options["mode"] = "railcar"
        options["cameraPosition"] = [0, 0, -depth/4]
        options["bounds"] = [0, 0, -depth/2, depth/2]
        options["yearRange"] = yearRange

    elif key == "geographyBars":
        options["keys"] = ["map"]
        options["labels"] = ["countries"]
        options["width"] = options["mapWidth"]
        options["height"] = options["barHeight"]
        options["depth"] = options["mapWidth"] / 2
        options["cameraPosition"] = [0, options["barHeight"]/8, -options["mapWidth"]/8]
        options["mode"] = "firstPerson"
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
        options["mode"] = "railcar"
        options["bounds"] = [-width/8, width/8, -depth/2, depth/2]
        options["yearRange"] = yearRange
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

def pointToWorld(point, view):
    bounds = view["bounds"]
    camPos = view["cameraPosition"]
    x = mu.lerp((bounds[1], bounds[0]), point["x"])
    y = camPos[1]
    z = mu.lerp((bounds[3], bounds[2]), point["y"])
    return { "x": x, "y": y, "z": z }

# Generate guide
if "guide" in config:
    viewKeys = visualizations.keys()
    guideSteps = config["guide"]
    for i, step in enumerate(guideSteps):
        # add layout to all steps
        if "changeLayout" not in step:
            if i > 0:
                guideSteps[i]["changeLayout"] = guideSteps[i-1]["changeLayout"]
            else:
                guideSteps[i]["changeLayout"] = viewKeys[0]
        viewKey = guideSteps[i]["changeLayout"]
        if "moveToLocation" in step:
            guideSteps[i]["moveToLocation"] = pointToWorld(step["moveToLocation"], visualizations[viewKey])
        if "lookAtLocation" in step:
            guideSteps[i]["lookAtLocation"] = pointToWorld(step["lookAtLocation"], visualizations[viewKey])
    outjson["guide"] = guideSteps

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

# Update HTML template
src = "apps/template"
dest = "apps/%s" % config["name"]
indexFilenameTemplate = src + "/index.html"
indexFilename = dest + "/index.html"

# Check for footer content
footerContent = '<div class="intro-footer">'
if "credits" in config:
    footerContent += '<div class="credits">'
    if not isinstance(config["credits"], list):
        config["credits"] = [config["credits"]]
    for credit in config["credits"]:
        footerContent += f'<a href="{credit["url"]}" target="_blank"><img src="{credit["image"]}" alt="{credit["name"]}" /></a>'
    footerContent += '</div>'
if "creditText" in config:
    footerContent += f'\n<p>{config["creditText"]}</p>'
footerContent += '</div>'
config["footerContent"] = footerContent

su.formatTextFile(indexFilenameTemplate, indexFilename, config)
io.copyFile(src + "/viewer.html", dest + "/viewer.html")

io.writeJSON(OUTPUT_FILE, outjson, pretty=True, prepend="_.extend(CONFIG, ", append=");")

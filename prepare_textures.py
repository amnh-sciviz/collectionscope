# -*- coding: utf-8 -*-

import argparse
import math
import numpy as np
import os
from PIL import Image
from pprint import pprint
import sys

import lib.image_utils as iu
import lib.io_utils as io
import lib.item_utils as tu
import lib.list_utils as lu
import lib.math_utils as mu

# input
parser = argparse.ArgumentParser()
parser.add_argument("-config", dest="CONFIG_FILE", default="config-sample.yml", help="Config file")
parser.add_argument("-cache", dest="CACHE_DIR", default="tmp/", help="Directory for caching image data")
parser.add_argument('-probe', dest="PROBE", action="store_true", help="Just output details?")
a = parser.parse_args()

config = tu.loadConfig(a.CONFIG_FILE)

maxWidth = 4096
maxTextureFiles = 10
minCellWidth = 1
maxCellWidth = 512
containsAlpha = config["imageHasAlpha"] if "imageHasAlpha" in config else False
defaultColor = config["defaultColor"] if "defaultColor" in config else "#3C3C3C"
filenameKey = config["filenameColumn"] if "filenameColumn" in config else "filename"
imageDir = config["imageDirectory"]
noImageValue = config["noImageValue"] if "noImageValue" in config else None

OUTPUT_DIR = "apps/{appname}/".format(appname=config["name"])
OUTPUT_TEXTURES_DIR_REL = "img/textures/"
OUTPUT_TEXTURES_DIR = OUTPUT_DIR + OUTPUT_TEXTURES_DIR_REL
CONFIG_FILE = OUTPUT_DIR + "js/config/config.textures.js"

if not a.PROBE:
    # Make sure output dirs exist
    io.makeDirectories([OUTPUT_TEXTURES_DIR, CONFIG_FILE, a.CACHE_DIR])

    # Remove existing images
    io.removeFiles(OUTPUT_TEXTURES_DIR + "*.jpg")

items, categories = tu.getItems(config)

# Make texture for each set
# sets = list(configSets.items())
sets = [] # just produce the default set for now
sets = [("default", {"query": ""})] + sets # add default set
jsonsets = {}
for keyName, options in sets:
    setItems = lu.filterByQueryString(items, options["query"])
    if len(setItems) > 0:
        print("%s results found for '%s'" % (len(setItems), options["query"]))
    else:
        print("Warning: '%s' produces no results" % options["query"])
        continue

    # limit the results if specified
    if "limit" in options and len(setItems) > options["limit"]:
        setItems = setItems[:options["limit"]]
    setCount = len(setItems)

    # determine ideal cell width
    cellWidth = maxCellWidth
    textureFileCount = 1
    cellsPerFile = 1
    while True:
        cellsPerFile = (maxWidth / cellWidth) ** 2
        textureFileCount = math.ceil(1.0 * setCount / cellsPerFile)

        if textureFileCount <= maxTextureFiles:
            print(" -> Found ideal cell width for %s: %spx with file count %s" % (keyName, cellWidth, textureFileCount))
            break

        if cellWidth <= minCellWidth:
            print(" -> Too many items! Minimum file count will be %s when cell width is %s (the minumum cell width)" % (textureFileCount, minCellWidth))
            sys.exit()
            break

        cellWidth /= 2

    if a.PROBE:
        continue

    cellsPerFile = int(cellsPerFile)
    cellWidth = int(cellWidth)
    textureFileCount = int(textureFileCount)
    cacheFilename = a.CACHE_DIR + "%s_%s_%s.p.gz" % (config["name"], keyName, cellWidth)
    imageData = io.readCacheFile(cacheFilename)

    colors = 3 if containsAlpha < 1 else 4
    colorMode = "RGB" if colors == 3 else "RGBA"

    # if no cache, read and process images and save cache
    if imageData is None:
        print("No cache for %s.. reading image data..." % keyName)
        shape = (setCount, cellWidth, cellWidth, colors)
        imageData = np.zeros(shape, dtype=np.uint8)
        for i, item in enumerate(setItems):
            basename = item[filenameKey]
            fn = imageDir + basename
            if "{" in fn:
                fn = fn.format(**item)
            # check for no image
            if noImageValue is not None and basename == noImageValue or not os.path.isfile(fn):
                img = Image.new(mode=colorMode, size=(cellWidth, cellWidth), color=defaultColor)
            else:
                img = iu.readImage(fn, mode=colorMode)
                if img is not None:
                    img = iu.containImage(img, cellWidth, cellWidth)

                if img is None:
                    img = Image.new(mode=colorMode, size=(cellWidth, cellWidth), color=defaultColor)

            imageData[i] = np.array(img)
            mu.printProgress(i+1, setCount)
        io.writeCacheFile(cacheFilename, imageData)

    setCount, cellWidth, cellWidth, colors = imageData.shape

    # build texture images
    startIndex = 0
    format = "jpg" if colors == 3 else "png"
    bgColor = [0, 0, 0] if colors == 3 else [0, 0, 0, 0]
    cellsPerRow = int(maxWidth / cellWidth)
    assetFiles = []
    for fileIndex in range(textureFileCount):
        textureImageFn = OUTPUT_TEXTURES_DIR + "%s_%s.%s" % (keyName, fileIndex, format)
        textureImageFnRel = OUTPUT_TEXTURES_DIR_REL + "%s_%s.%s" % (keyName, fileIndex, format)
        endIndex = startIndex + cellsPerFile
        fileImageData = imageData[startIndex:] if endIndex >= setCount else imageData[startIndex:endIndex]
        baseImg = Image.new(mode=colorMode, size=(maxWidth, maxWidth), color=tuple(bgColor))
        basePixels = np.zeros((maxWidth, maxWidth, colors), dtype=np.uint8)
        for i in range(len(fileImageData)):
            col = int(i % cellsPerRow)
            row = int(i / cellsPerRow)
            x = col * cellWidth
            y = row * cellWidth
            basePixels[y:y+cellWidth, x:x+cellWidth] = fileImageData[i]
        iu.savePixelsToImage(textureImageFn, basePixels)
        startIndex += cellsPerFile
        assetFiles.append({"src": textureImageFnRel})

    jsonsets[keyName] = {
        "width": maxWidth,
        "height": maxWidth,
        "cellWidth": cellWidth,
        "cellHeight": cellWidth,
        "assets": assetFiles
    }

if a.PROBE:
    sys.exit()

# Write config file
outjson = {
    "textures": jsonsets
}
io.writeJSON(CONFIG_FILE, outjson, pretty=True, prepend="_.extend(CONFIG, ", append=");")

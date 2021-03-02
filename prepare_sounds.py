# -*- coding: utf-8 -*-

import argparse
import math
import os
import numpy as np
from pprint import pprint
import sys

import lib.audio_utils as au
import lib.io_utils as io
import lib.item_utils as tu
import lib.list_utils as lu
import lib.math_utils as mu

# input
parser = argparse.ArgumentParser()
parser.add_argument("-config", dest="CONFIG_FILE", default="config-sample.yml", help="Config file")
parser.add_argument("-dir", dest="AUDIO_DIR", default="audio/", help="Audio directory")
parser.add_argument('-overwrite', dest="OVERWRITE", action="store_true", help="Overwrite existing audio?")
a = parser.parse_args()

config = tu.loadConfig(a.CONFIG_FILE)
configSounds = config["sounds"]

PRECISION = 5
OUTPUT_DIR = "apps/{appname}/".format(appname=config["name"])
OUTPUT_SOUND_DIR_REL = "data/sounds/"
OUTPUT_SOUND_DIR = OUTPUT_DIR + OUTPUT_SOUND_DIR_REL
CONFIG_FILE = OUTPUT_DIR + "js/config/config.sounds.js"

# Make sure output dirs exist
io.makeDirectories([OUTPUT_SOUND_DIR, CONFIG_FILE])

# Remove existing data
io.removeFiles(OUTPUT_SOUND_DIR + "*.json")

sets, items = tu.getItems(config)
itemCount = len(items)

def getYearSounds(spriteData, userOptions={}):
    global items
    cfg = {
        "dimension": 2 # use z-axis
    }

    yearCol = "year"
    if yearCol not in items[0]:
        print("Could not find column %s in items, please add this column to metadata cols with 'type' = 'int'" % yearCol)
        sys.exit()

    sprites = spriteCount = None
    if spriteData is not None:
        sprites = spriteData["sprites"]
        spriteCount = len(sprites)

    years = [item[yearCol] for item in items]
    minYear = min(years)
    maxYear = max(years) + 1
    nUnit = 1.0 / (maxYear-minYear)

    sounds = []
    for i in range(maxYear-minYear):
        x = y = 0.5
        year = minYear + i
        z = mu.norm(year, (minYear, maxYear)) + nUnit*0.5 # center
        sounds += [round(x, PRECISION), round(y, PRECISION), round(z, PRECISION)]
        if sprites is not None:
            spriteIndex = mu.roundInt(1.0 * z * (spriteCount-1))
            sprite = sprites[spriteIndex]
            sounds += [sprite["start"], sprite["dur"]]

    return (cfg, sounds)

jsonSounds = {}
for soundKey, soundOptions in configSounds.items():
    soundConfig = soundOptions.copy()
    soundData = None

    audioFilename = dataFilename = spriteData = None
    isSprite = False
    # build sprites if necessary
    if "filenames" in soundOptions:
        isSprite = True
        filenames = [soundOptions["src"]+f for f in soundOptions["filenames"]]
        basename = a.AUDIO_DIR + soundKey
        quantities = soundOptions["quantities"] if "quantities" in soundOptions else None
        audioFilename = basename+".mp3"
        dataFilename = basename+".json"
        if not os.path.isfile(audioFilename) or not os.path.isfile(dataFilename) or a.OVERWRITE:
            spriteData = au.makeSpriteFile(audioFilename, dataFilename, filenames, soundOptions["spriteDuration"], soundOptions["db"], soundOptions["reverb"], quantities)
        else:
            spriteData = io.readJSON(dataFilename)
            print("Sprite file already created, skipping...")
        soundConfig["filename"] = os.path.basename(audioFilename)
        soundConfig["spriteFilename"] = os.path.basename(dataFilename)
        soundConfig.pop("filenames", None)

    layout = soundOptions["layout"]
    if layout == "years":
        _soundConfig, soundData = getYearSounds(spriteData)
        soundConfig.update(_soundConfig)

    else:
        print("Invalid layout: %s" % layout)
        continue

    # Write sound file
    if soundData is not None:
        soundOutFile = OUTPUT_SOUND_DIR + soundKey + ".json"
        io.writeJSON(soundOutFile, soundData)
        soundConfig["src"] = OUTPUT_SOUND_DIR_REL + soundKey + ".json"

    soundConfig["isSprite"] = isSprite

    jsonSounds[soundKey] = soundConfig

# Write config file
outjson = {
    "sounds": jsonSounds
}
io.writeJSON(CONFIG_FILE, outjson, pretty=True, prepend="_.extend(CONFIG, ", append=");")

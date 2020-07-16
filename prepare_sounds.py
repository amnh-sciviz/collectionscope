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
parser.add_argument("-config", dest="CONFIG_FILE", default="config-sample.json", help="Config file")
parser.add_argument("-dir", dest="AUDIO_DIR", default="audio/", help="Audio directory")
a = parser.parse_args()

config = io.readJSON(a.CONFIG_FILE)
configSounds = config["sounds"]

for key, options in configSounds.items():
    filenames = [options["src"]+f for f in options["filenames"]]
    basename = a.AUDIO_DIR + key
    quantities = options["quantities"] if "quantities" in options else None
    au.makeSpriteFile(basename+".mp3", basename+".json", filenames, options["spriteDuration"], options["db"], quantities)

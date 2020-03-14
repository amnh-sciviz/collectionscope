# -*- coding: utf-8 -*-

import argparse
import math
import os
from pprint import pprint
import sys

import lib.io_utils as io
import lib.list_utils as lu
import lib.math_utils as mu

# input
parser = argparse.ArgumentParser()
parser.add_argument('-in', dest="INPUT_FILE", default="data/metadata.csv", help="CSV file with metadata")
parser.add_argument('-app', dest="APP_NAME", default="sample", help="Name of your app that you created with scaffold.py")
parser.add_argument('-dir', dest="OUTPUT_DIR", default="apps/{appname}/", help="Directory of data files; most likely leave as is")
a = parser.parse_args()

# Make sure output dirs exist
io.makeDirectories([OUTPUT_DIR])

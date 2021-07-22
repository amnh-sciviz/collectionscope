# -*- coding: utf-8 -*-

import argparse
import inspect
import geopy
from geopy.geocoders import Nominatim
import math
import os
from pprint import pprint
import sys
import time

# add parent directory to sys path to import relative modules
currentdir = os.path.dirname(os.path.abspath(inspect.getfile(inspect.currentframe())))
parentdir = os.path.dirname(currentdir)
sys.path.insert(0,parentdir)

from lib.io_utils import *
from lib.list_utils import *
from lib.math_utils import *
from lib.string_utils import *

# input
parser = argparse.ArgumentParser()
parser.add_argument('-in', dest="INPUT_FILE", default="path/to/metadata.csv", help="Path to csv file")
parser.add_argument('-user', dest="USER_AGENT", default="collectionscope/1.0 (email@name.org)", help="The name of your app and email address for using Open Street Map Nominatim service: https://wiki.openstreetmap.org/wiki/Nominatim")
parser.add_argument('-aliases', dest="COUNTRY_ALIASES", default="data/country_aliases.csv", help="A .csv file with a list of alternative names for countries")
parser.add_argument('-country', dest="COUNTRY_COLUMN", default="Country", help="Column that contains country string")
parser.add_argument('-state', dest="STATE_COLUMN", default="", help="Column that contains state string. Leave blank if not present.")
parser.add_argument('-city', dest="CITY_COLUMN", default="", help="Column that contains city string. Leave blank if not present.")
parser.add_argument('-address', dest="ADDRESS_COLUMN", default="", help="Column that contains address string. Leave blank if not present.")
parser.add_argument('-out', dest="OUTPUT_FILE", default="", help="Output file; leave blank to just update the input file")
parser.add_argument('-tmp', dest="CACHE_DIRECTORY", default="tmp/geolookup/", help="Directory for storing cached geo lookups")
parser.add_argument('-overwrite', dest="OVERWRITE", action="store_true", help="Overwrite existing cache data?")
parser.add_argument('-probe', dest="PROBE", action="store_true", help="Just output debug info")
parser.add_argument('-wait', dest="WAIT_SECONDS", default=2, help="Wait this many seconds between requests; should be >=1 according to https://operations.osmfoundation.org/policies/nominatim/")

a = parser.parse_args()

OUTPUT_FILE = a.OUTPUT_FILE if len(a.OUTPUT_FILE) > 0 else a.INPUT_FILE

# Make sure output dirs exist
makeDirectories([a.CACHE_DIRECTORY, OUTPUT_FILE])

_, aliases = readCsv(a.COUNTRY_ALIASES)
aliasLookup = createLookup(aliases, "match")

parts = []
columns = []
if a.COUNTRY_COLUMN != "":
    parts.append("country")
    columns.append(a.COUNTRY_COLUMN)

if a.STATE_COLUMN != "":
    parts.append("state")
    columns.append(a.STATE_COLUMN)

if a.CITY_COLUMN != "":
    parts.append("city")
    columns.append(a.CITY_COLUMN)

if a.ADDRESS_COLUMN != "":
    parts.append("street")
    columns.append(a.ADDRESS_COLUMN)

fieldNames, rows = readCsv(a.INPUT_FILE)
rows = addIndices(rows, keyName="_index")

uniqueValues = []
uniqueFileIds = []
idLookup = {}
for row in rows:
    isValid = True
    rowValue = []
    for j, col in enumerate(columns):
        value = str(row[col]).strip()
        if parts[j] == "country" and value in aliasLookup:
            value = aliasLookup[value]["target"]
        rowValue.append(value)
        if len(value) < 1 and parts[j] == "country":
            isValid = False
    if not isValid:
        continue
    rowValue = tuple(rowValue)
    valueId = "_".join(stringToId(part) for part in list(rowValue))
    if valueId not in idLookup:
        uniqueValues.append(rowValue)
        uniqueFileIds.append(valueId)
        idLookup[valueId] = [row["_index"]]
    else:
        idLookup[valueId].append(row["_index"])

total = len(uniqueValues)
print(f'Found {total} unique values to look up.')
if a.PROBE:
    pprint(uniqueValues)
    sys.exit()

geolocator = Nominatim(user_agent=a.USER_AGENT)
tParts = tuple(parts)
for i, v in enumerate(uniqueValues):
    fid = uniqueFileIds[i]
    filename = a.CACHE_DIRECTORY + fid + ".p"
    cachedData = None
    if os.path.isfile(filename) and not a.OVERWRITE:
        cachedData = loadData(filename)

    if cachedData is None:
        _lookupValue = dict(zip(tParts, v))
        # remove empty items
        lookupValue = {}
        for key, value in _lookupValue.items():
            value = str(value).strip()
            if len(value) > 0:
                lookupValue[key] = value
        location = None
        try:
            location = geolocator.geocode(lookupValue)
        except geopy.exc.GeocoderTimedOut:
            location = None

        if location is not None:
            cachedData = {
                "Lookup": lookupValue,
                "Matched Address": location.address,
                "Latitude": location.latitude,
                "Longitude": location.longitude
            }
        else:
            print(f' No match for: {fid}')
            cachedData = {
                "Lookup": lookupValue,
                "Matched Address": "",
                "Latitude": "",
                "Longitude": ""
            }
        writeData(filename, cachedData, a.OVERWRITE)
        time.sleep(a.WAIT_SECONDS)

    for rowIndex in idLookup[fid]:
        for col in ["Matched Address", "Latitude", "Longitude"]:
            rows[rowIndex][col] = cachedData[col]
            if col not in fieldNames:
                fieldNames.append(col)

    printProgress(i+1, total)

writeCsv(OUTPUT_FILE, rows, fieldNames)

import csv
import json
import os

import lib.math_utils as mu

def makeDirectories(filenames):
    if not isinstance(filenames, list):
        filenames = [filenames]
    for filename in filenames:
        dirname = os.path.dirname(filename)
        if not os.path.exists(dirname):
            os.makedirs(dirname)

def parseQueryString(queryStr, parseNumbers=True):
    query = dict([tuple(c.split("=")) for c in queryStr.strip().split("&")])
    if parseNumbers:
        for key in query:
            query[key] = mu.parseNumber(query[key])
    return query

def readCsv(filename, verbose=True, parseNumbers=True):
    rows = []
    fieldnames = []
    if os.path.isfile(filename):
        with open(filename, "r", encoding="utf8") as f:
            lines = list(f)
            reader = csv.DictReader(lines, skipinitialspace=True)
            if len(lines) > 0:
                fieldnames = list(reader.fieldnames)
            rows = list(reader)
            if parseNumbers:
                rows = mu.parseNumbers(rows)
            if verbose:
                print("Read %s rows from %s" % (len(rows), filename))
    return (fieldnames, rows)

def writeJSON(filename, data, verbose=True, pretty=False, prepend="", append=""):
    with open(filename, "w", encoding="utf8") as f:
        jsonStr = ""
        if pretty:
            jsonStr = json.dumps(data, indent=2)
        else:
            jsonStr = json.dumps(data)
        jsonStr = prepend + jsonStr + append
        f.write(jsonStr)
        if verbose:
            print("Wrote data to %s" % filename)

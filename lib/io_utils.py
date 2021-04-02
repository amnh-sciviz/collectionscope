import bz2
import csv
import glob
import json
import os
import pickle
import requests
import shutil
import yaml
from yaml import Loader

import lib.math_utils as mu

def copyFile(fromFile, toFile):
    shutil.copyfile(fromFile, toFile)

def downloadBinaryFile(url, filename, overwrite=False):
    if os.path.isfile(filename) and not overwrite:
        print("%s already exists." % filename)
        return True
    print("Downloading %s..." % url)
    response = requests.get(url, stream=True)
    with open(filename, 'wb') as f:
        shutil.copyfileobj(response.raw, f)
    del response

def getFileExt(fn):
    basename = os.path.basename(fn)
    return "." + basename.split(".")[-1]

def loadData(fn, compressed=False):
    result = None
    if compressed and not fn.endswith(".bz2"):
        fn += ".bz2"
    if fn and os.path.isfile(fn):
        print("Loading cache file %s..." % fn)
        f = bz2.open(fn, "rb") if compressed else open(fn, "rb")
        if f:
            result = pickle.load(f)
            print("Loaded cache file %s" % fn)
        f.close()
    return result

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

def readCacheFile(fn):
    result = None
    if os.path.isfile(fn):
        print("Loading cache file %s..." % fn)
        with bz2.open(fn, "rb") as f:
            result = pickle.load(f)
            print("Loaded cache file %s" % fn)
    return result

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
    else:
        print("No file found at %s" % filename)
    return (fieldnames, rows)

def readJSON(filename):
    data = {}
    if os.path.isfile(filename):
        with open(filename, "r", encoding="utf8") as f:
            data = json.load(f)
    else:
        print("No file found at %s" % filename)
    return data

def readTextFile(filename):
    contents = ""
    if os.path.isfile(filename):
        with open(filename, "r", encoding="utf8") as f:
            contents = f.read()
    else:
        print("No file found at %s" % filename)
    return contents

def readYaml(filename):
    data = {}
    if os.path.isfile(filename):
        with open(filename, encoding="utf8") as f:
            data = yaml.load(f, Loader=Loader)
    else:
        print("No file found at %s" % filename)
    return data

def removeFiles(listOrString):
    filenames = listOrString
    if not isinstance(listOrString, list) and "*" in listOrString:
        filenames = glob.glob(listOrString)
    elif not isinstance(listOrString, list):
        filenames = [listOrString]
    print("Removing %s files" % len(filenames))
    for fn in filenames:
        if os.path.isfile(fn):
            os.remove(fn)

def writeCacheFile(fn, data):
    print("Writing cache to %s..." % fn)
    pickle.dump(data, bz2.open(fn, 'wb'))
    print("Wrote cache to %s." % fn)

def writeCsv(filename, arr, headings="auto", append=False, encoding="utf8", verbose=True, listDelimeter=" | "):
    if headings == "auto":
        headings = arr[0].keys() if len(arr) > 0 and type(arr[0]) is dict else None
    mode = 'w' if not append else 'a'
    with open(filename, mode, encoding=encoding, newline='') as f:
        writer = csv.writer(f)
        if not append and headings is not None:
            writer.writerow(headings)
        for i, d in enumerate(arr):
            row = []
            if headings is not None:
                for h in headings:
                    value = ""
                    if h in d:
                        value = d[h]
                    if isinstance(value, list):
                        value = listDelimeter.join(value)
                    row.append(value)
            else:
                row = d
            writer.writerow(row)
    if verbose:
        print("Wrote %s rows to %s" % (len(arr), filename))

def writeData(fn, data, overwrite=False, compressed=False):
    if compressed and not fn.endswith(".bz2"):
        fn += ".bz2"
    if not os.path.isfile(fn) or overwrite:
        print("Saving cache file %s..." % fn)
        if compressed:
            pickle.dump(data, bz2.open(fn, 'wb'))
        else:
            pickle.dump(data, open(fn, 'wb'))
    else:
        print("Already exists %s" % fn)
    return True

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

def writeTextFile(filename, text):
    with open(filename, "w", encoding="utf8", errors="replace") as f:
        f.write(text)

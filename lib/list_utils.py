from collections import Counter
import itertools
from operator import itemgetter
from pprint import pprint

import lib.math_utils as mu

def addIndices(arr, keyName="index", startIndex=0):
    for i, item in enumerate(arr):
        arr[i][keyName] = startIndex + i
    return arr

def createLookup(arr, key):
    return dict([(str(item[key]), item) for item in arr])

def filterByQuery(arr, ors):
    if isinstance(ors, tuple):
        ors = [[ors]]
    # pprint(ors)

    if len(ors) < 1:
        return arr

    results = []

    for item in arr:
        for ands in ors:
            andValid = True
            for key, comparator, value in ands:
                itemValue = item[key]
                if comparator not in ["CONTAINS", "EXCLUDES"]:
                    value = mu.parseNumber(value)
                    itemValue = mu.parseNumber(itemValue)
                if comparator == "<=" and itemValue > value:
                    andValid = False
                    break
                elif comparator == ">=" and itemValue < value:
                    andValid = False
                    break
                elif comparator == "<" and itemValue >= value:
                    andValid = False
                    break
                elif comparator == ">" and itemValue <= value:
                    andValid = False
                    break
                elif comparator == "CONTAINS" and value not in itemValue:
                    andValid = False
                    break
                elif comparator == "EXCLUDES" and value in itemValue:
                    andValid = False
                    break
                elif comparator == "!=" and itemValue == value:
                    andValid = False
                    break
                elif comparator == "=" and itemValue != value:
                    andValid = False
                    break
            if andValid:
                results.append(item)
                break
    return results

def filterByQueryString(arr, str):
    ors = parseQueryString(str)
    return filterByQuery(arr, ors)

def flattenList(arr):
    return [item for sublist in arr for item in sublist]

def getKeyByValue(d, value):
    found = ""
    for key, itemValue in d.items():
        if itemValue == value:
            found = itemValue
            break
    return found

def groupList(arr, groupBy, sort=False, desc=True):
    groups = []
    arr = sorted(arr, key=itemgetter(groupBy))
    for key, items in itertools.groupby(arr, key=itemgetter(groupBy)):
        group = {}
        litems = list(items)
        count = len(litems)
        group[str(groupBy)] = key
        group["items"] = litems
        group["count"] = count
        groups.append(group)
    if sort:
        reversed = desc
        groups = sorted(groups, key=lambda k: k["count"], reverse=reversed)
    return groups

def groupListByValue(arr):
    return list(zip(Counter(arr).keys(), Counter(arr).values()))

def parseQueryString(str):
    if len(str) <= 0:
        return []
    comparators = ["<=", ">=", " EXCLUDES ", " CONTAINS ", "!=", ">", "<", "="]
    orStrings = str.split(" OR ")
    ors = []
    for orString in orStrings:
        andStrings = str.split(" AND ")
        ands = []
        for andString in andStrings:
            for comparator in comparators:
                if comparator in andString:
                    parts = [part.strip() for part in andString.split(comparator)]
                    ands.append(tuple([parts[0], comparator.strip(), parts[1]]))
                    break
        ors.append(ands)
    return ors

def stringsToValueTable(values):
    uValues = unique(values)
    uValues = sorted(uValues)
    stringValueTable = {}
    for i, value in enumerate(uValues):
        stringValueTable[value] = i
    return stringValueTable

def unique(arr):
    return list(set(arr))

def updateTuple(tup, index, value):
    arr = list(tup)
    arr[index] = value
    return tuple(arr)

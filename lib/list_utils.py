from pprint import pprint

import lib.math_utils as mu

def addIndices(arr, keyName="index", startIndex=0):
    for i, item in enumerate(arr):
        arr[i][keyName] = startIndex + i
    return arr

def filterByQuery(arr, ors):
    if isinstance(ors, tuple):
        ors = [[ors]]
    # pprint(ors)

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

def unique(arr):
    return list(set(arr))

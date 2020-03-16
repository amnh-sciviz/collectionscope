import lib.math_utils as mu

def addIndices(arr, keyName="index", startIndex=0):
    for i, item in enumerate(arr):
        arr[i][keyName] = startIndex + i
    return arr

def parseQueryString(str, parseNumbers=False):
    if len(str) <= 0:
        return []
    pairStrings = str.split("&")
    pairs = []
    for string in pairStrings:
        key, value = tuple(string.split("="))
        if parseNumbers:
            value = mu.parseNumber(value)
        pairs.append((key, value))
    return pairs

def unique(arr):
    return list(set(arr))



import lib.io_utils as io
import lib.list_utils as lu

def addColumnsToItems(items, config):
    configMeta = config["metadata"]
    columns =  configMeta["cols"]

    # create sets for those calls that need indices
    sets = {}
    for col in columns:
        if "asIndex" in col and col["asIndex"]:
            prop = col["fromKey"]
            sets[col["toKey"]] = sorted(lu.unique([item[prop] for item in items if prop in item]))

    for i, item in enumerate(items):
        for col in columns:
            if "fromKey" not in col:
                continue
            fromKey = col["fromKey"]
            toKey = col["toKey"]
            value = item[fromKey] if fromKey in item else ""
            if "asIndex" in col and col["asIndex"] and toKey in sets:
                value = sets[toKey].index(value) if value in sets[toKey] else -1
            items[i][toKey] = value

    return (sets, items)

def getItems(config):
    configMeta = config["metadata"]

    inputFile = configMeta["src"]
    idColumn = configMeta["id"]

    fieldnames, items = io.readCsv(inputFile, parseNumbers=False)
    if "query" in configMeta:
        items = lu.filterByQueryString(items, configMeta["query"])
        print("%s items after filtering" % len(items))

    # Sort so that index corresponds to ID
    items = sorted(items, key=lambda item: item[idColumn])
    items = lu.addIndices(items)

    return items

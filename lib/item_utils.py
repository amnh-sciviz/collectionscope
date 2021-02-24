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
            if "type" in col and col["type"] == "int":
                value = int(value)
            elif "type" in col and col["type"] == "float":
                value = float(value)
            if "asIndex" in col and col["asIndex"] and toKey in sets:
                value = sets[toKey].index(value) if value in sets[toKey] else -1
            items[i][toKey] = value

    return (sets, items)


def getItems(config):
    inputFile = config["metadataFile"]
    idCol = config["identifierColumn"]

    fieldnames, items = io.readCsv(inputFile, parseNumbers=False)
    if "metadataFilterQuery" in config:
        items = lu.filterByQueryString(items, config["metadataFilterQuery"])
        print("%s items after filtering" % len(items))

    # Sort so that index corresponds to ID
    items = sorted(items, key=lambda item: item[idCol])
    items = lu.addIndices(items)

    return items

def loadConfig(fn):
    return io.readYaml(fn)

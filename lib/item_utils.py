import lib.io_utils as io
import lib.list_utils as lu
import lib.string_utils as su

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

def getItemCategories(items, key="category"):
    values = []
    for item in items:
        if key not in item:
            continue
        value = item[key]
        if value not in values:
            values.append(value)
    values = sorted(values)
    return values

def getItems(config):
    inputFile = config["metadataFile"]
    idCol = config["identifierColumn"] if "identifierColumn" in config else None

    fieldnames, items = io.readCsv(inputFile, parseNumbers=False)
    if "metadataFilterQuery" in config:
        items = lu.filterByQueryString(items, config["metadataFilterQuery"])
        print("%s items after filtering" % len(items))

    # map year, lat/lon, and category
    columnMap = [
        ("dateColumn", "year"),
        ("latitudeColumn", "lat"),
        ("longitudeColumn", "lon"),
        ("countryColumn", "country"),
        ("groupByColumn", "category")
    ]
    minimumYear = config["minimumYear"] if "minimumYear" in config else None
    maximumYear = config["maximumYear"] if "maximumYear" in config else None
    validItems = []
    for i, item in enumerate(items):
        validatedItem = item.copy()
        isValid = True
        for configKey, toColumn in columnMap:
            if configKey not in config:
                continue

            value = item[config[configKey]]
            if toColumn == "year":
                value = su.validateYear(value, minimumYear, maximumYear)
            elif toColumn == "lat":
                value = su.validateLat(value)
            elif toColumn == "lon":
                value = su.validateLon(value)
            if value is None:
                isValid = False
                break

            validatedItem[toColumn] = value

        if isValid:
            validItems.append(validatedItem)

    diff = len(items) - len(validItems)
    print(f'Found {diff} invalid items.')

    # Sort so that index corresponds to ID
    if idCol is not None:
        for i, item in enumerate(validItems):
            validItems[i]["_id"] = str(item[idCol])
        validItems = sorted(validItems, key=lambda item: item["_id"])

    validItems = lu.addIndices(validItems)
    if idCol is None:
        for i, item in enumerate(validItems):
            validItems[i]["_id"] = str(i)

    # Retrieve categories
    categories = []
    itemsByCategory = lu.groupList(validItems, "category", sort=True, desc=True)
    if "groupLimit" in config and len(itemsByCategory) > config["groupLimit"]:
        limit = config["groupLimit"]-1
        otherItems = itemsByCategory[limit:]
        otherLabel = config["otherLabel"] if "otherLabel" in config else "Other"
        otherCount = 0
        for group in otherItems:
            for item in group["items"]:
                validItems[item["index"]]["category"] = otherLabel
                otherCount += 1
        itemsByCategory = itemsByCategory[:limit] + [{"category": otherLabel, "count": otherCount}]
    categoryColors = config["groupColors"]
    colorCount = len(categoryColors)
    for i, category in enumerate(itemsByCategory):
        color = categoryColors[i % colorCount]
        categories.append({
            "text": category["category"],
            "color": color,
            "count": category["count"]
        })

    return (validItems, categories)

def loadConfig(fn):
    return io.readYaml(fn)

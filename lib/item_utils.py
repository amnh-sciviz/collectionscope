import yaml
import lib.io_utils as io

def loadConfig(config_file):
    """
    Load the configuration from a YAML file.
    """
    with open(config_file, 'r', encoding='utf-8') as file:
        config = yaml.safe_load(file)
    return config

def getItems(config):
    """
    Read the items from the CSV or XLSX file specified in the configuration.
    """
    inputFile = config['metadataFile']
    file_ext = io.getFileExt(inputFile)
    
    if file_ext == '.csv':
        fieldnames, items = io.readCsv(inputFile, parseNumbers=False, encoding='utf-8')
    elif file_ext in ['.xlsx', '.xls']:
        items = io.readXlsx(inputFile)
        fieldnames = items[0].keys() if items else []
    else:
        raise ValueError(f"Unsupported file extension: {file_ext}")

    # Assuming 'categories' is needed, extract it from items if present
    categories = []
    if 'categoryColumn' in config:
        categories = list(set(item[config['categoryColumn']] for item in items if config['categoryColumn'] in item))
    
    return items, categories

def parseNumbers(items, fields):
    """
    Convert fields in items to numbers where applicable.
    """
    for item in items:
        for field in fields:
            if field in item and item[field].isdigit():
                item[field] = int(item[field])
            else:
                try:
                    item[field] = float(item[field])
                except ValueError:
                    pass
    return items

def addCategoryColors(items, categories, config):
    """
    Add colors to categories in items based on the configuration.
    """
    color_map = {category: color for category, color in zip(categories, config['groupColors'])}
    for item in items:
        if 'categoryColumn' in config and config['categoryColumn'] in item:
            item['color'] = color_map.get(item[config['categoryColumn']], "#000000")
    return items

def filterItems(items, filterQuery):
    """
    Filter items based on the filter query from the configuration.
    """
    return [item for item in items if eval(filterQuery)]

def sortItems(items, sortBy):
    """
    Sort items based on a specified field.
    """
    return sorted(items, key=lambda x: x.get(sortBy, ''))

def groupItems(items, groupBy):
    """
    Group items based on a specified field.
    """
    grouped_items = {}
    for item in items:
        key = item.get(groupBy, 'Other')
        if key not in grouped_items:
            grouped_items[key] = []
        grouped_items[key].append(item)
    return grouped_items

def getFields(config):
    """
    Extract fields from the configuration.
    """
    return config.get('itemFields', [])

def formatItems(items, fields):
    """
    Format items based on specified fields.
    """
    formatted_items = []
    for item in items:
        formatted_item = {}
        for field in fields:
            if field['column'] in item:
                formatted_item[field['label']] = item[field['column']]
        formatted_items.append(formatted_item)
    return formatted_items

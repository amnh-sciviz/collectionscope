import re

import lib.io_utils as io
import lib.math_utils as mu

def formatText(text, params):
    return text.format(**params)

def formatTextFile(infile, outfile, params):
    text = io.readTextFile(infile)
    ftext = formatText(text, params)
    io.writeTextFile(outfile, ftext)

def validateLat(value):
    value = mu.parseNumber(value, alwaysFloat=True, invalidValue=None)
    if value is None:
        return None

    if value < -90.0 or value > 90.0:
        return None

    return value

def validateLon(value):
    value = mu.parseNumber(value, alwaysFloat=True, invalidValue=None)
    if value is None:
        return None

    if value < -180.0 or value > 180.0:
        return None

    return value

def validateYear(value, minYear=1000, maxYear=2050):
    matches = re.findall('\d{4}', str(value))
    year = None
    if matches:
        for match in matches:
            matchInt = int(match)
            if (minYear is None or matchInt >= minYear) and (maxYear is None or matchInt <= maxYear):
                year = matchInt
                break
    return year

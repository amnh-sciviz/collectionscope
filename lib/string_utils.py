
import lib.io_utils as io

def formatText(text, params):
    return text.format(**params)

def formatTextFile(infile, outfile, params):
    text = io.readTextFile(infile)
    ftext = formatText(text, params)
    io.writeTextFile(outfile, ftext)

# -*- coding: utf-8 -*-

import argparse
import os
import subprocess
import sys

import lib.io_utils as io

# input
parser = argparse.ArgumentParser()
parser.add_argument("-config", dest="CONFIG_FILE", default="config-sample.json", help="Config file")
parser.add_argument("-python", dest="PYTHON_NAME", default="", help="Name of your python command (e.g. python, python3, etc)")
parser.add_argument('-clean', dest="CLEAN", action="store_true", help="Start from scratch if app already exists?")
parser.add_argument('-probe', dest="PROBE", action="store_true", help="Just print commands?")
a = parser.parse_args()

PYTHON_NAME = a.PYTHON_NAME if len(a.PYTHON_NAME) > 0 else sys.executable
config = io.readJSON(a.CONFIG_FILE)
overwriteFlag = ' -overwrite' if a.CLEAN else ''

commands = [
    '{python_name} scaffold.py -name "{app_name}"{overwrite}'.format(python_name=PYTHON_NAME, app_name=config["name"], overwrite=overwriteFlag),
    '{python_name} prepare_metadata.py -config "{config_file}"'.format(python_name=PYTHON_NAME, config_file=a.CONFIG_FILE),
    '{python_name} prepare_sets.py -config "{config_file}"'.format(python_name=PYTHON_NAME, config_file=a.CONFIG_FILE),
    '{python_name} prepare_positions.py -config "{config_file}"'.format(python_name=PYTHON_NAME, config_file=a.CONFIG_FILE),
    '{python_name} prepare_textures.py -config "{config_file}"'.format(python_name=PYTHON_NAME, config_file=a.CONFIG_FILE),
    '{python_name} prepare_labels.py -config "{config_file}"'.format(python_name=PYTHON_NAME, config_file=a.CONFIG_FILE),
    '{python_name} prepare_sounds.py -config "{config_file}"'.format(python_name=PYTHON_NAME, config_file=a.CONFIG_FILE),
    '{python_name} prepare_content.py -config "{config_file}"'.format(python_name=PYTHON_NAME, config_file=a.CONFIG_FILE)
]

for command in commands:
    print('-------------------------------')
    print(command)
    if a.PROBE:
        continue
    finished = subprocess.check_call(command, shell=True)

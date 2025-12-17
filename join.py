#!/usr/bin/env python3

from collections import defaultdict
import csv
import json

all = {}
for region in ['eu', 'us']:
    joined = defaultdict(dict)
    for metric in ['gdp', 'land', 'pop']:
        with open(f'data/{region}/{metric}.csv', 'r') as f:
            for state, value in csv.reader(f):
                joined[state][metric] = float(value)

    states = []
    for state, metrics in joined.items():
        if len(metrics) != 3:
            print(f'bad data for {state}: {metrics}')
        states.append([state, metrics['gdp'], metrics['land'], metrics['pop']])
    all[region] = states

with open('data.json', 'w') as f:
    json.dump(all, f, separators=(',',':'))

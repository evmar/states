#!/bin/bash

set -e

npm run bundle
cp index.html states.js pages

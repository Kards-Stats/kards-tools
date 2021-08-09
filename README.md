[![codecov](https://codecov.io/gh/Kards-Stats/kards-tools/branch/main/graph/badge.svg?token=R1K3WAXVT0)](https://codecov.io/gh/Kards-Stats/kards-tools)
[![Version](https://img.shields.io/github/package-json/v/Kards-Stats/kards-tools?color=blue&label=Master%20Version)](https://github.com/Kards-Stats/kards-tools/blob/main/package.json)
[![NPM Version](https://img.shields.io/npm/v/@kards-stats/kards-tools?color=blue&label=NPM%20Version)](https://github.com/Kards-Stats/kards-tools/blob/main/package.json)
[![Node Version](https://img.shields.io/node/v/@kards-stats/kards-tools?label=Node%20Version)](https://github.com/Kards-Stats/kards-tools/blob/main/package.json)
[![Requirements Status](https://requires.io/github/Kards-Stats/kards-tools/requirements.svg?branch=main)](https://requires.io/github/Kards-Stats/kards-tools/requirements/?branch=main)
[![DeepScan grade](https://deepscan.io/api/teams/14943/projects/18070/branches/432262/badge/grade.svg)](https://deepscan.io/dashboard#view=project&tid=14943&pid=18070&bid=432262)

# kards-tools
Library used for interacting with the kards backend

Includes other library functions that are used by multiple kards-stats projects

## Cloning
After cloning the repo, apart from the normal ```npm i```, it is required to run ```npm run dev:generate``` and is advised to also run ```npm run clean```

## Usage
Development is changing the way this module works, check tests and source code to see how it is used in its current form. Sorry :/

## Testing
Due to the nature of this project and the fact that this project uses un-documented API routes, the released package will never be garaunteed stable.

These tests use sensative information (usernames and passwords to log into kards), these have been placed in json files with example json files published to git.

To run the tests, simply rename all *.example.json to *.json and fill in any information, then run ```npm run test``` which will clean and build then test.

## Versioning
All NPM release source can be found in the releases section.

Pre v1 (0.x.x-alpha) Alpha releases do NOT follow semantic versioning instead of <major>.<minor>.<patch> they follow 0.<major>.<minor> as functionality was changing during development

## Commiting
This repo along with all kards-stats active repos use ```standard``` or ```ts-standard``` to format files. Please follow it.
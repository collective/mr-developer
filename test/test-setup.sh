#!/bin/bash

cd test
mkdir src
mkdir fake
cd fake
git init repo1
cd repo1
echo "File 1" > file1.txt
git add file1.txt
git commit -am "Add file 1"

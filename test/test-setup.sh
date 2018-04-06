#!/bin/bash

cd test
rm -rf src fake-remote
mkdir src
mkdir fake-remote
cd fake-remote
git init repo1
cd repo1
echo "File 1" > file1.txt
git add file1.txt
git commit -am "Add file 1"
git tag v1
echo "File 2" > file2.txt
git add file2.txt
git commit -am "Add file 2"
git checkout -b staging
echo "More text" >> file1.txt
git commit -am "Modify file 1"
git checkout master

cd ../../..
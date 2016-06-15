#!/bin/sh
rm -r logs/*
rm -r deploy/*
tar zcvf deploy/modules.tgz index.html index.js package.json config logs

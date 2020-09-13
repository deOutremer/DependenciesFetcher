"use strict";
// TODO: get package name from user
// TODO: run as app
// TODO: Tests
// TODO: concurrency
// TODO: draw tree
// TODO: put all on GitHub
const { readFile, readFileSync } = require('fs');
const express = require('express');
const port = 3000;
const app = express();
//app.get("/", (req, res) => {
//    res.send( await readFile('./home.html', 'utf8') );
//} )
//app.listen(process.env.PORT || 3000, () => console.log(`App avaiable on http://localhost: `+port);

const axios = require('axios');

//for testing
let packageName = 'raw-body';
let packageVersion = '2.4.0';
const cache = {};
const awaitingCallback = {};


async function getDependencies(name, version) {
    version = normalizeVersion(version)
    let packageIsBeingQueried = awaitingCallback.hasOwnProperty(name) && awaitingCallback[name] == version;
    let packageKey = `${name}@${version}`
    let packageInCache = cache.hasOwnProperty(packageKey);
    let normalizedDeps
    if (packageInCache || packageIsBeingQueried) {
        return;
    }
    awaitingCallback[name] = version;
    let result
    try {
        result = await axios.get(`https://registry.npmjs.org/${name}/${version}`);
    } catch (e) {
        console.error(e.config.url)
        debugger;
    }
    delete awaitingCallback[name];
    normalizedDeps = recreatingDependenciesObject(result.data.dependencies);
    cache[result.data._id] = normalizedDeps
    
    
    const promises = [];
    for(let dependency in normalizedDeps) {   
        const packageVersion = normalizedDeps[dependency]
        const packageName = dependency;
        promises.push(getDependencies(packageName, packageVersion));
    }
    await Promise.all(promises);
}

async function run(name, version) {
    await getDependencies(name, version);
    console.log(cache)
    //const res = processCache();
}

function normalizeVersion(string) {
    string = string
        .replace(/^~/, '')
        .replace(/^\^/, '')
        .replace(/^<=/, '')
        .replace(/^>=/, '')
        return string.trim().split(' ')[0]
}

function recreatingDependenciesObject(deps) {
    const result = {}
    for (let dep in deps) {
        result[dep] = normalizeVersion(deps[dep])
    }
    return result;
}

run(packageName, packageVersion);
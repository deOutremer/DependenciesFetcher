"use strict";
// TODO: Tests
// TODO: concurrency
// TODO: draw tree

const { readFile } = require('fs');
const express = require('express');
const app = express();
var bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({ extended: false }));
const port = 3000;


let packageName;
let packageVersion;

app.get("/", (req, res) => {
    readFile('./home.html', 'utf8', (err, html) => {
        if (err) {
            res.status(500).send('sorry, out of order')
        }
        res.send(html)
    }) 
} );

app.post('/submit-package-info', function (req, res) {
    packageName = req.body.package_name;
    packageVersion = req.body.package_version;
    res.send(`${packageName} Submitted Successfully`);
    run(packageName, packageVersion);
});

var server = app.listen(port, function () {
    console.log('Node server is running...');
});

const axios = require('axios');

//for testing
//let packageName = 'raw-body';
//let packageVersion = '2.4.0';
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
    try {
        const dependenciesGraph = new DirectedGraph(cache)
    } catch (e) {
        console.error(e)
        debugger;
    }
    console.log(dependenciesGraph)
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


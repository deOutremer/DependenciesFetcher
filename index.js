"use strict";

const express = require('express');
const axios = require('axios');
const cytoscape = require('cytoscape');
const app = express();
var bodyParser = require("body-parser"); 

app.use(bodyParser.urlencoded({ extended: false }));
const port = 3000;



app.use("/", express.static("public"));

app.post('/', async function (req, res) {
    const packageName = req.body.package_name;
    const packageVersion = req.body.package_version;
    await run(packageName, packageVersion);
});

var server = app.listen(port, function () {
    console.log('Node server is running...');
});



/*for testing ///////////////////////////
let packageName = 'raw-body';
let packageVersion = '2.4.0';

//////////////////////////////////////*/


async function getDependenciesWrapper(name, version) {
    let cache = {};
    const awaitingCallback = {};
    await getDependencies(name, version, cache, awaitingCallback);
    return cache;
}

async function getDependencies(name, version, cache, awaitingCallback) {
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
        promises.push(getDependencies(packageName, packageVersion, cache, awaitingCallback));
    }
    await Promise.all(promises);
}



async function run(name, version) {
    const cache = await getDependenciesWrapper(name, version);
    graphify(cache);
   
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
/*
{
    nodes: [
        { data: { id: "pkg1@1.0.0", name: "pkg1@1.0.0" } },
        { data: { id: "pkg2@2.0.0", name: "pkg2@2.0.0" } },
    ],
    edges: [
        { data: { source: "pkg1@1.0.0", target: "pkg2@2.0.0" } },
        { data: { source: "pkg1@1.0.0", target: "pkg4@4.0.0" } },
    ]
};
*/


function graphify(cache) {
    const graph = {"nodes": [], "edges": []}
    const existingNodes = {};
    for (let pkg in cache) {
        if (!existingNodes.hasOwnProperty(pkg)) {
           graph["nodes"].push({data: { id: `${pkg}`, name: `${pkg}` }})
           existingNodes[pkg] = true;
        }
        for (let dependency in cache[pkg]) {
            const depNode = `${dependency}@${cache[pkg][dependency]}`
            if (!existingNodes.hasOwnProperty(depNode)) {
                 graph["nodes"].push({data: { id: depNode, name: depNode }})
                 existingNodes[depNode] = true;
            }
            graph["edges"].push({data: { source: `${pkg}`, target: depNode }})
        }
    }; 
    return graph
}
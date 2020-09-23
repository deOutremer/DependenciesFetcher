"use strict";

const express = require('express');
const axios = require('axios');
const app = express();
var bodyParser = require("body-parser"); 

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
const port = 3000;



app.use("/", express.static("public"));

app.post('/', async function (req, res) {
    const packageName = req.body.package_name;
    const packageVersion = req.body.package_version;
    const graph = await run(packageName, packageVersion);
    res.json(graph);
});

/*
var server = app.listen(port, function () {
   console.log('Node server is running...');
});*/




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
    return graphify(cache);
   
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
    console.log(cache)
    const graph = {"nodes": [], "edges": []}
    const existingNodes = {};
    for (let pkg in cache) {
        console.log(pkg)
        if (!existingNodes.hasOwnProperty(pkg)) {
           graph.nodes.push({data: { id: `${pkg}`, name: `${pkg}` }})
           existingNodes[pkg] = true;
        }
        for (let dependency in cache[pkg]) {
            const depNode = `${dependency}@${cache[pkg][dependency]}`
            console.log(depNode)
            if (!existingNodes.hasOwnProperty(depNode)) {
                 graph.nodes.push({data: { id: depNode, name: depNode }})
                 existingNodes[depNode] = true;
            }
            graph.edges.push({data: { source: `${pkg}`, target: depNode }})
        }
    }; 
    return graph
}
module.exports = {
    graphify
  }
  

/*
1. Use DB for cache - for each user need to keep the starting point of the call (which dependency to start from):
    1. We create 3 servers with different responsibilities: Users server, Cache Server, Updating server
        1. Users server is responsibble for controlling users trafic (throtteling) and maintaining a task queue for the Cache server

        2. Cache Server
            1. Maintain a single cache on a DB
            2. Start the chache in advance by adding some of the most popular and most dependent uppon packages, to save calles to npm.
            3. When a call is made, if a package is not there, add it. 
            4. Create a local cache for the call from the DB for each user
            5. from the local cache create the graph.
            6. Save in the DB the product of each call (the graph) so that we can get it fast if the same call is made by different users.
            This way we can gradually build a mapping of npm and as time goes by make fewer calls to npm.
            7. Return answer to user
        
        3. Updating server
            1. Maintain a list of, let's say, 10000 most popular packages (by looking at the number of downloads each package has) and updates their dependencies daily in the cache.
            2. Run a daily update to the most popular packages
            3. Run a daily update on all existing packages in the cache to update them if needed

    2. Use events to communicate between the servers so that they will not interfere with each others work and currupt the DB

2. Better way to serve the app
*/
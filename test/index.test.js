const { graphify } = require('../index')

it('converts a cache to a graph', () => {
    const dummyCache = { 'raw-body@2.4.0': { 'name1': 'version1' ,  'name2': 'version2' } }
    

    const expectedGraph = {
        nodes: [
            { data: { id: "raw-body@2.4.0", name: "raw-body@2.4.0" } },
            { data: { id: "name1@version1", name: "name1@version1" } },
            { data: { id: "name2@version2", name: "name2@version2" } },
        ],
        edges: [
            { data: { source: "raw-body@2.4.0", target: "name1@version1" } },
            { data: { source: "raw-body@2.4.0", target: "name2@version2" } },
        ]
    };

    const result = graphify(dummyCache)
    expect(result).toEqual(expectedGraph)
})


async function submit() {
    const form = document.getElementById('renderer')
    const body = new URLSearchParams(new FormData(form));
    const response = await fetch('/',{
        method: "post",
        body: body,
    })
    const json = await response.json()
    renderGraph(json)
}


function renderGraph(graph) {

    window.cytoscape({
      container: document.getElementById("graph"),
  
      layout: {
        name: "concentric",
        concentric: function (n) {
          return n.id() === "j" ? 200 : 0;
        },
        levelWidth: function (nodes) {
          return 100;
        },
        minNodeSpacing: 100
      },
  
      style: [
        {
          selector: "node[name]",
          style: {
            content: "data(name)"
          }
        },
  
        {
          selector: "edge",
          style: {
            "curve-style": "bezier",
            "target-arrow-shape": "triangle"
          }
        },
  
        // some style for the extension
  
        {
          selector: ".eh-handle",
          style: {
            "background-color": "red",
            width: 12,
            height: 12,
            shape: "ellipse",
            "overlay-opacity": 0,
            "border-width": 12, // makes the handle easier to hit
            "border-opacity": 0
          }
        },
  
        {
          selector: ".eh-hover",
          style: {
            "background-color": "red"
          }
        },
  
        {
          selector: ".eh-source",
          style: {
            "border-width": 2,
            "border-color": "red"
          }
        },
  
        {
          selector: ".eh-target",
          style: {
            "border-width": 2,
            "border-color": "red"
          }
        },
  
        {
          selector: ".eh-preview, .eh-ghost-edge",
          style: {
            "background-color": "red",
            "line-color": "red",
            "target-arrow-color": "red",
            "source-arrow-color": "red"
          }
        },
  
        {
          selector: ".eh-ghost-edge.eh-preview-active",
          style: {
            opacity: 0
          }
        }
      ],
  
      elements: graph
    });
  }


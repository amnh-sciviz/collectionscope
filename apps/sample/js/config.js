var CONFIG = {
  // define your metadata files, which contains information about each item; should at least contain id
  // in most cases, there is just one default file
  "metadata": {
    "default": {"src": "data/metadata/default.json"}
  },
  // define your sets; these are basically lists of ids for mapping to texture or position files that don't contain the full set of items
  // by default, all items in the metadata file will be displayed
  "sets": {
    "mexico": {"src": "data/filters/mexico.json"},
    "lumholtz": {"src": "data/filters/lumholtz.json"},
    "lumholtzItem": {"ids": [0]}
  },
  // define your texture files, which can be one or more "spritesheets" (grids of images)
  // dimensions should be powers of 2
  // the default texture should contain all the texture detail for all the metadata
  // this should be used in conjunction with sets if texture files contain only a subset of items
  "textures": {
    "default": {
      "assets": [
        {"width": 512, "height": 512, "cellw": 1, "cellh": 1, "src": "img/textures/default.png"}
      ]
    },
    "mexico": {
      "set": "mexico",
      "assets": [
        {"width": 4096, "height": 4096, "cellw": 32, "cellh": 32, "src": "img/textures/mexico1.jpg"},
        {"width": 4096, "height": 4096, "cellw": 32, "cellh": 32, "src": "img/textures/mexico2.jpg"},
        {"width": 4096, "height": 4096, "cellw": 32, "cellh": 32, "src": "img/textures/mexico3.jpg"}
      ]
    },
    "lumholtzItem": {
      "set": "lumholtzItem",
      "assets": [
        {"width": 512, "height": 512, "cellw": 512, "cellh": 512, "src": "img/textures/lumholtzItem.jpg"}
      ]
    }
  },
  // define your position files; can be a list of [x,y] pairs (z will be zero or "defaultZ") or [x,y,z] triples
  // the default file should contain positions for all items
  // this should be used in conjunction with sets if position file contain only a subset of items
  "positions": {
    "default": {"src": "data/positions/default.json"}
  },
  // define your content for displaying on the UI layer
  "content": {
    "default": {
      "text": "In its 150 year history, the American Museum of Natural History collected X cultural artifacts from all over the world"
    },
    "mexico": {
      "text": "In its 150 year history, the American Museum of Natural History collected X cultural artifacts from Mexico"
    },
    "lumholtz": {
      "image": "https://lbry-web-007.amnh.org/digital/files/thumbnails/05d7c86dfd3d1eaba0b26ce30555e17a.jpg",
      "imageCaption": "Tarahumara women, Guadalupe, Chihuahua, 1892",
      "imageUrl": "https://lbry-web-007.amnh.org/digital/items/show/18793",
      "title": "Lumholtz Mexico Expeditions",
      "html": "<p>This figure was collected as part of the Mexico expeditions led by Carl Lumholtz between 1890 and 1897. <a href=\"https://anthro.amnh.org/lumholtz_collection\">Read more</a> or <a href=\"https://lbry-web-007.amnh.org/digital/items/browse?advanced%5B0%5D%5Belement_id%5D=49&advanced%5B0%5D%5Btype%5D=is+exactly&advanced%5B0%5D%5Bterms%5D=Lumholtz+Expeditions+to+Mexico+%281890-1898%29+\">Browse more photos from this expedition</a>.</p>"
    },
    "lumholtzItem": {
      "image": "",
      "title": "Male Human Figure",
      "text": "A human male figure with animal head made of stone can be found in the Mexico and Central America Hall in the American Museum of Natural History"
    }
  },
  // define your UI components here (slider or buttons)
  "ui": {
    "slider": {
      "steps": [
        {
          "label": "Male Human Figure",
          "metadata": "default",
          "positions": "default",
          "content": "lumholtzItem",
          "zoom": "auto",
          "pan": "auto",
          "meshes": [
            {
              "textures": "default",
              "alpha": 0.2
            },{
              "textures": "lumholtzItem"
            }
          ]
        },{
          "label": "Lumholtz Mexico Expeditions",
          "metadata": "default",
          "positions": "default",
          "content": "lumholtz",
          "zoom": "auto",
          "pan": "auto",
          "meshes": [
            {
              "textures": "default",
              "alpha": 0.2
            },{
              "textures": "mexico",
              "set": "lumholtz"
            }
          ]
        },{
          "label": "Mexico",
          "metadata": "default",
          "content": "mexico",
          "positions": "default",
          "zoom": "auto",
          "pan": "auto",
          "meshes": [
            {
              "textures": "default",
              "alpha": 0.2
            },{
              "textures": "mexico"
            }
          ]
        },{
          "label": "Everything",
          "metadata": "default",
          "content": "default",
          "positions": "default",
          "zoom": "auto",
          "pan": "auto",
          "meshes": [
            {
              "textures": "default"
            }
          ]
        }
      ]
    }
  }
}

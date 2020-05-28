_.extend(CONFIG, {
  "content": {
    "default": {
      "text": "In its 150 year history, the American Museum of Natural History collected {count} cultural artifacts from all over the world"
    },
    "mexico": {
      "set": "mexico",
      "text": "In its 150 year history, the American Museum of Natural History collected {count} cultural artifacts from Mexico"
    },
    "lumholtz": {
      "set": "lumholtz",
      "image": "https://lbry-web-007.amnh.org/digital/files/thumbnails/05d7c86dfd3d1eaba0b26ce30555e17a.jpg",
      "imageCaption": "Tarahumara women, Guadalupe, Chihuahua, 1892",
      "imageCaptionUrl": "https://lbry-web-007.amnh.org/digital/items/show/18793",
      "title": "Lumholtz Mexico Expeditions",
      "html": "<p>Carl Lumholtz led an expedition to Mexico between 1890 and 1897. <a href=\"https://anthro.amnh.org/lumholtz_collection\">Read more</a> or <a href=\"https://lbry-web-007.amnh.org/digital/items/browse?advanced%5B0%5D%5Belement_id%5D=49&advanced%5B0%5D%5Btype%5D=is+exactly&advanced%5B0%5D%5Bterms%5D=Lumholtz+Expeditions+to+Mexico+%281890-1898%29+\">Browse more photos from this expedition</a>.</p>"
    },
    "lumholtzItem": {
      "set": "lumholtzItem",
      "text": "This figure was collected as part of the Mexico expeditions led by Carl Lumholtz between 1890 and 1897. It now can be found in the Mexico and Central America Hall in the American Museum of Natural History."
    }
  },
  "ui": {
    "transitionDuration": 3000,
    "menus": [
      {
        "id": "radio-buttons-layout",
        "label": "Choose layout",
        "className": "radio-buttons radio-buttons-layout",
        "radioButtons": [
          {
            "label": "Grid",
            "name": "positions",
            "value": "default",
            "checked": true
          },
          {
            "label": "By Time",
            "name": "positions",
            "value": "time"
          },
          {
            "label": "By Geography",
            "name": "positions",
            "value": "geography"
          }
        ]
      },
      {
        "id": "slider-zoom",
        "className": "slider slider-zoom",
        "slider": [
          {
            "label": "Male Human Figure",
            "positions": "default",
            "content": "lumholtzItem",
            "zoom": "lumholtzItem",
            "meshes": [
              {
                "textures": "default",
                "alpha": 0.2
              },
              {
                "textures": "lumholtzItem"
              }
            ]
          },
          {
            "label": "Lumholtz Mexico Expeditions",
            "positions": "default",
            "content": "lumholtz",
            "zoom": "lumholtz",
            "meshes": [
              {
                "textures": "default",
                "alpha": 0.2
              },
              {
                "textures": "mexico",
                "set": "lumholtz"
              }
            ]
          },
          {
            "label": "Mexico",
            "content": "mexico",
            "positions": "default",
            "zoom": "mexico",
            "meshes": [
              {
                "textures": "default",
                "alpha": 0.2
              },
              {
                "textures": "mexico"
              }
            ]
          },
          {
            "label": "Everything",
            "content": "default",
            "positions": "default",
            "zoom": "default",
            "meshes": [
              {
                "textures": "default"
              }
            ]
          }
        ]
      }
    ]
  }
});
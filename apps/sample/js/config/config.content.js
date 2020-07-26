_.extend(CONFIG, {
  "views": {
    "random": {
      "layout": "randomSphere",
      "controls": [
        "firstPerson"
      ],
      "menus": [
        "viewOptions"
      ],
      "width": 16384,
      "height": 16384,
      "depth": 16384,
      "cameraPosition": [
        0,
        0,
        -1024
      ],
      "bounds": [
        -8192,
        8192,
        -8192,
        8192
      ]
    },
    "timeline": {
      "layout": "timelineTunnel",
      "controls": [
        "firstPerson"
      ],
      "menus": [
        "viewOptions"
      ],
      "keys": [
        "years"
      ],
      "labels": [
        "years"
      ],
      "sounds": [
        "yearLabels"
      ],
      "width": 512,
      "height": 512,
      "depth": 65536,
      "cameraPosition": [
        0,
        0,
        -17080
      ],
      "bounds": [
        -256,
        256,
        -32768,
        32768
      ]
    },
    "categoryTimeline": {
      "layout": "sphereCategoryTimeline",
      "controls": [
        "firstPerson"
      ],
      "menus": [
        "viewOptions"
      ],
      "labels": [
        "years",
        "categoryYears"
      ],
      "keys": [
        "years"
      ],
      "sounds": [
        "yearLabels"
      ],
      "width": 1024,
      "height": 512,
      "depth": 65536,
      "cameraPosition": [
        0,
        256,
        -17080
      ],
      "bounds": [
        -256,
        256,
        -32768,
        32768
      ]
    },
    "map": {
      "layout": "geographyBars",
      "controls": [
        "firstPerson"
      ],
      "menus": [
        "viewOptions"
      ],
      "keys": [
        "map"
      ],
      "labels": [
        "countries"
      ],
      "overlays": [
        "map"
      ],
      "width": 8192,
      "height": 2048,
      "depth": 4096,
      "cameraPosition": [
        0,
        256,
        -1024
      ],
      "bounds": [
        -8192,
        8192,
        -4096,
        4096
      ]
    }
  },
  "content": {
    "default": {
      "text": "In its 150 year history, the American Museum of Natural History collected {count} cultural artifacts from all over the world"
    },
    "laufer": {
      "query": "Donor CONTAINS Laufer AND Country CONTAINS China AND Acquisition Year < 1910",
      "visibleTimeRange": [
        1900,
        1905
      ],
      "image": "https://lbry-web-007.amnh.org/digital/files/thumbnails/cd198760f782344a393abae73444b7d8.jpg",
      "imageCaption": "Sacred dance of five lamas, China",
      "imageCaptionUrl": "https://lbry-web-007.amnh.org/digital/items/show/29130",
      "title": "Laufer China Expedition",
      "html": "<p>Berthold Laufer led an expedition to China between 1901 and 1904. <a href=\"https://anthro.amnh.org/laufer_collection\">Read more</a> or <a href=\"https://lbry-web-007.amnh.org/digital/items/browse?advanced%5B0%5D%5Belement_id%5D=49&advanced%5B0%5D%5Btype%5D=is+exactly&advanced%5B0%5D%5Bterms%5D=Laufer+China+Expedition+%281901-1904%29\">Browse more photos from this expedition</a>.</p>"
    },
    "lumholtz": {
      "query": "Donor CONTAINS Lumholtz AND Country CONTAINS Mexico AND Acquisition Year < 1902",
      "visibleTimeRange": [
        1890,
        1897
      ],
      "image": "https://lbry-web-007.amnh.org/digital/files/thumbnails/05d7c86dfd3d1eaba0b26ce30555e17a.jpg",
      "imageCaption": "Tarahumara women, Guadalupe, Chihuahua, 1892",
      "imageCaptionUrl": "https://lbry-web-007.amnh.org/digital/items/show/18793",
      "title": "Lumholtz Mexico Expeditions",
      "html": "<p>Carl Lumholtz led an expedition to Mexico between 1890 and 1897. <a href=\"https://anthro.amnh.org/lumholtz_collection\">Read more</a> or <a href=\"https://lbry-web-007.amnh.org/digital/items/browse?advanced%5B0%5D%5Belement_id%5D=49&advanced%5B0%5D%5Btype%5D=is+exactly&advanced%5B0%5D%5Bterms%5D=Lumholtz+Expeditions+to+Mexico+%281890-1898%29+\">Browse more photos from this expedition</a>.</p>"
    }
  },
  "ui": {
    "startTransitionDuration": 5000,
    "transitionDuration": 3000,
    "minAlpha": 0.0,
    "menus": {
      "viewOptions": {
        "id": "radio-buttons-views",
        "type": "radioItems",
        "label": "Choose your layout",
        "className": "radio-buttons radio-buttons-views",
        "default": true,
        "radioItems": [
          {
            "name": "change-view",
            "value": "random",
            "label": "Random",
            "checked": true
          },
          {
            "name": "change-view",
            "value": "timeline",
            "label": "Timeline"
          },
          {
            "name": "change-view",
            "value": "categoryTimeline",
            "label": "Regions over time"
          },
          {
            "name": "change-view",
            "value": "map",
            "label": "Map"
          }
        ]
      }
    },
    "keys": {
      "map": {},
      "years": {}
    },
    "overlays": {
      "map": {}
    }
  }
});
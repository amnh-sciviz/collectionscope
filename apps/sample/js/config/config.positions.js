_.extend(CONFIG, {
  "positions": {
    "start": {
      "layout": "spheres",
      "width": 16384,
      "height": 16384,
      "depth": 16384,
      "cameraPosition": [
        0,
        0,
        -1024
      ]
    },
    "default": {
      "zCol": "Acquisition Year",
      "layout": "tunnel",
      "width": 512,
      "height": 512,
      "depth": 65536,
      "cameraPosition": [
        0,
        0,
        -2048
      ],
      "src": "data/positions/default.json"
    }
  }
});
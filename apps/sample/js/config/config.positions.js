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
        -2048
      ]
    },
    "default": {
      "zCol": "Acquisition Year",
      "layout": "tunnel",
      "width": 2048,
      "height": 2048,
      "depth": 32768,
      "cameraPosition": [
        0,
        0,
        -4096
      ],
      "src": "data/positions/default.json"
    }
  }
});
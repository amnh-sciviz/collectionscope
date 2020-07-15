_.extend(CONFIG, {
  "content": {
    "default": {
      "text": "In its 150 year history, the American Museum of Natural History collected {count} cultural artifacts from all over the world"
    },
    "laufer": {
      "set": "laufer",
      "image": "https://lbry-web-007.amnh.org/digital/files/thumbnails/cd198760f782344a393abae73444b7d8.jpg",
      "imageCaption": "Sacred dance of five lamas, China",
      "imageCaptionUrl": "https://lbry-web-007.amnh.org/digital/items/show/29130",
      "title": "Laufer China Expedition",
      "html": "<p>Berthold Laufer led an expedition to China between 1901 and 1904. <a href=\"https://anthro.amnh.org/laufer_collection\">Read more</a> or <a href=\"https://lbry-web-007.amnh.org/digital/items/browse?advanced%5B0%5D%5Belement_id%5D=49&advanced%5B0%5D%5Btype%5D=is+exactly&advanced%5B0%5D%5Bterms%5D=Laufer+China+Expedition+%281901-1904%29\">Browse more photos from this expedition</a>.</p>"
    }
  },
  "ui": {
    "startTransitionDuration": 5000,
    "transitionDuration": 1000,
    "minAlpha": 0.0,
    "menus": [
      {
        "id": "radio-buttons-region",
        "type": "radioItems",
        "label": "Filter by region",
        "className": "radio-buttons radio-buttons-region",
        "property": "region",
        "parseType": "int",
        "radioItems": [
          {
            "label": "All",
            "name": "filter-region",
            "value": -1,
            "checked": true
          },
          {
            "label": "Africa",
            "name": "filter-region",
            "value": 0
          },
          {
            "label": "Asia",
            "name": "filter-region",
            "value": 1
          },
          {
            "label": "Mexico And Central America",
            "name": "filter-region",
            "value": 2
          },
          {
            "label": "North America",
            "name": "filter-region",
            "value": 3
          },
          {
            "label": "Pacific",
            "name": "filter-region",
            "value": 4
          },
          {
            "label": "South America",
            "name": "filter-region",
            "value": 5
          }
        ]
      }
    ]
  }
});
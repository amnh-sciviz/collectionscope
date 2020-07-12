_.extend(CONFIG, {
  "content": {
    "default": {
      "text": "In its 150 year history, the American Museum of Natural History collected {count} cultural artifacts from all over the world"
    },
    "asia": {
      "set": "asia",
      "text": "In its 150 year history, the American Museum of Natural History collected {count} cultural artifacts from Asia"
    },
    "china": {
      "set": "china",
      "text": "In its 150 year history, the American Museum of Natural History collected {count} cultural artifacts from China"
    },
    "laufer": {
      "set": "laufer",
      "image": "https://lbry-web-007.amnh.org/digital/files/thumbnails/cd198760f782344a393abae73444b7d8.jpg",
      "imageCaption": "Sacred dance of five lamas, China",
      "imageCaptionUrl": "https://lbry-web-007.amnh.org/digital/items/show/29130",
      "title": "Laufer China Expedition",
      "html": "<p>Berthold Laufer led an expedition to China between 1901 and 1904. <a href=\"https://anthro.amnh.org/laufer_collection\">Read more</a> or <a href=\"https://lbry-web-007.amnh.org/digital/items/browse?advanced%5B0%5D%5Belement_id%5D=49&advanced%5B0%5D%5Btype%5D=is+exactly&advanced%5B0%5D%5Bterms%5D=Laufer+China+Expedition+%281901-1904%29\">Browse more photos from this expedition</a>.</p>"
    },
    "lauferItem": {
      "set": "lauferItem",
      "text": "This engraved incense burner was collected as part of the Laufer China Expedition expedition led by Berthold Laufer between 1901 and 1904. It now can be found in the Gardner D. Stout Hall of Asian Peoples in the American Museum of Natural History."
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
            "label": "Random",
            "name": "positions",
            "value": "default",
            "checked": true
          },
          {
            "label": "By region",
            "name": "positions",
            "value": "regions"
          },
          {
            "label": "By time and region",
            "name": "positions",
            "value": "timeRegions"
          },
          {
            "label": "By geography",
            "name": "positions",
            "value": "geography"
          }
        ]
      }
    ]
  }
});
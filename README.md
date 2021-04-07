# Collectionscope

Collectionscope is an open source software engine for visualizing museum collections across time and space in three dimensional space. [Visit our homepage](https://amnh-sciviz.github.io/collectionscope/) for more details about this project.

![An animated gif of the Collectionscope timeline layout where the camera is flying through a tunnel of items organized by time](https://raw.githubusercontent.com/amnh-sciviz/collectionscope/master/img/CollectionScopeVideoLoop.gif)

You can view a [demo of this tool here](https://amnh-sciviz.github.io/collectionscope/apps/amnh/).

## Who is this software engine for?

Organizations, institutions, and individuals who:

1. have a collection of somewhere between 1,000 and 250,000 items
2. have the following metadata for those items:
    - title
    - date (can be messy!)
    - location (e.g. country of origin)
    - image URL (low to medium resolution)
3. have personnel with some data and programming knowledge (see next section)

## Requirements

### Personnel

This software was designed to require minimal technical resources needed to make complex visualizations of collections. However, there is currently no self-serve interface or wizard available, so you will still need personnel with some data and programming knowledge to properly set this up. You will need one or more people who cover all of the following:

1. Someone who is familiar with your data and can prepare a .CSV file with specific metadata (e.g. title, date, location, image URL)
2. Someone who can run (and possibly troubleshoot) [Python](https://www.python.org/) scripts (e.g. a junior programmer or analyst) and edit [Yaml](https://en.wikipedia.org/wiki/YAML) files.
3. Someone who knows how to publish (and optionally customize) a basic static web page (via Github or other host)

### Software

All the scripts necessary for creating your own project are contained in this repository. To start, you should [fork](https://docs.github.com/en/github/getting-started-with-github/fork-a-repo) this repository, then [create a local clone](https://docs.github.com/en/github/getting-started-with-github/fork-a-repo#step-2-create-a-local-clone-of-your-fork) of your fork.

You will need [Python 3.x](https://www.python.org/) installed to process and generate your project and [node.js](https://nodejs.org/en/) installed to run your project locally.

You can run the following to install all the necessary Python libraries:

```
pip install -r requirements.txt
```

And the following to install the necessary Node.js modules (currently just a simple server)

```
npm install
```

## Creating your own project

There are 4 primary steps to creating a project using your own collections: (1) Preparing your data, (2) configuring your project, (3) generating your project, and (4) viewing and deploying your project. Likely the first step (preparing your data) will be the most time-consuming depending on the current state and location of your data. But once your data is properly prepared, the remaining steps will hopefully be relatively easy.

### 1. Preparing your data

The first step is to create a [comma-separated-value (CSV)](https://en.wikipedia.org/wiki/Comma-separated_values) file that contains all the relevant metadata of your collection. At minimum, there should be a column (with a column heading with a name of your choice) for each of the following fields:

1. ***An identifier***: a unique identifier for the item. This will be used to keep track of items and their assets. This should be a number or string that can be used as a valid filename.
   - e.g. _"500009"_, _"A 109.345"_, _"item-10984"_
2. ***Title or name***: a short string that will act as a title of the item. Should not contain formatting and should not be too long.
   - e.g. _"Female Figure with Child"_, _"Water Deity (Chalchiuhtlicue)"_
3. ***A date that contains a year***: this will be used to put the items along a timeline. This can be any kind of date like date of creation, acquisition, accession, etc. This can be messy and inconsistent. Only the first valid year (in YYYY format) will be extracted from this field. Examples:
   - _"1976"_, _"1976-01-30"_, _"1/30/1976"_, _"January 30, 1976"_ - in all these cases "1976" will be used
   - _"1976-1978"_, _"1976-78"_, _"1976 or 1978"_ - the first year will be used ("1976")
   - _"1/30/76"_ - this is ***invalid*** since "76" is ambiguous
   - _"20th century"_, _"197?"_, _"70's"_ - all ***invalid*** examples
4. ***A location***: this will be used to place the items on a map of the world. Any of the following can be used:
   - Two separate columns for latitude and longitude as decimal values, e.g. Latitude: _"43.63871944444445"_, Longitude: _"-116.2413513485235"_
   - Or a single column with a string representation of a country name, e.g. _"Egypt"_, _"Federated States of Micronesia"_. [OpenStreetMap](https://www.openstreetmap.org/)'s [Nominatim](https://wiki.openstreetmap.org/wiki/Nominatim) service will be used to geocode the country based on this string.
      - Optionally you can also have separate columns for state, city, and street address if you want more specific points. Country is the only required field in this case.
5. ***Item category or group***: this is open ended and will be used to allow users to organize/group your items in meaningful ways. Ideally there are somewhere between 3 and 12 categories, but you will have the option to group the remaining items into an "Other" category. Some examples:
   - _"Medium"_ that has values "Ceramic", "Clay", "Metal", "Pigment", "Stone", "Wood"
   - _"Region"_ that has values "Africa", "Asia", "Central America", "Europe", "Middle East"", "North America", "Oceania, "South American"
   - _"Department"_ that has values "Anthropology", "Astrophysics", "Paleontology", "Physical Sciences", "Planetary Sciences", "Zoology"
   - _"Subject"_ that has values "War", "Commerce", "Politics", "Entertainment"
6. ***A public image URL***: this will be used to (1) generate thumbnails for this experience, and (2) display a higher resolution image of an item when they click on it. It's recommended for this image to be small to medium size (about 400px to 1200px max dimension) to reduce loading and processing time.  
7. ***Any other metadata to display to user***: arbitrary field that will be displayed to the user when they click on an item.
   - e.g. Dimensions, Creators, Donors
   - A column that contains a ***public URL*** for the item is recommended if you want link at item to its source

Place this file anywhere accessible to the computer that you will be running the Python scripts from.

#### Geocoding your data

For \#4 (location), if you have a string representation of your location (e.g. _"Egypt"_, _"Federated States of Micronesia"_), you will need to run the geocoding process to generate latitude and longitude values:

```
python scripts/geocode_locations.py \
  -in "path/to/metadata.csv" \
  -user "my-app-name/1.0 (user@organization.org)" \
  -country "Country"
```

In the above example:

- The `-in` parameter should contain the relative or absolute path to your .csv file
- The `-user` parameter will be used to identify your app and contact to the free [OpenStreetMap](https://www.openstreetmap.org/)'s [Nominatim](https://wiki.openstreetmap.org/wiki/Nominatim) service as per its [usage policy](https://operations.osmfoundation.org/policies/nominatim/)
- The `-country` parameter is the name of the column that contains a country string to be geocoded

Optionally, you can also identify address, city, and state columns (country is still required):

```
python scripts/geocode_locations.py \
  -in "path/to/metadata.csv" \
  -user "my-app-name/1.0 (user@organization.org)" \
  -country "Country" \
  -address "Street Address" \
  -city "City" \
  -state "State"
```

This process will update your .csv file and add "Latitude" and "Longitude" columns if they were found. Please make sure the script has permission to write to this file (e.g. make sure it's not open by another program).

#### Downloading your images to produce thumbnails

In order to generate thumbnails for use in the app, you will need to download the images somewhere that is accessible to the computer running the Python scripts. If the images are already somewhere accessible, great! In this case, what you will need to do is have a column (e.g. "Filename") in your .csv file that contains the filename of the image of the item (e.g. _"ITEM_1234.jpg"_).

If you need to download the images and you have a column in your .csv that contains a public image URL, you can use the following script to download them locally (make sure you have enough space for this!):

```
python scripts/download_images.py \
  -in "path/to/metadata.csv" \
  -image "primaryImageSmall"
  -id ""Object ID"
  -out "F:/collectionscope/images/"
  -threads 2
```

In the above example:

- The `-in` parameter should contain the relative or absolute path to your .csv file
- The `-image` parameter is the name of the column that contains the public image URL (e.g. _"https://example.com/image123.jpg"_)
- The `-id` parameter is the name of the column that contains the identifier string or number of the item. This will be used to name the image file. For example, if you download "https://example.com/image123.jpg" and the identifier for that item is "123", it will name the file "123.jpg".
- The `-out` parameter should contain the relative or absolute path the folder that you would like to save the images.
- The `-threads` is the number of concurrent requests you'd like to make. For example, "-threads 2" will allow two downloads to happen simultaneously at any given moment. This is limited by the number of threads your processor allows.

This process will update your .csv file and add a "Filename" column indicating the name of the image file saved . Please make sure the script has permission to write to this file (e.g. make sure it's not open by another program).

### 2. Configuring your project

Next, make a copy of [./config-sample.yml](config-sample.yml) and name it whatever you like (e.g. "config-my-project.yml").

Edit this file, following the directions via the embedded comments contained within this file. It mostly allows you to define the names of the columns in your .csv file and provide information about your collection. There are a number of sections that you can comment out (e.g. "Stories" and "Guide") if you want a more minimal experience or if you just want to try out the visualizations of the data without adding additional context. There are also a number of fields that you can leave alone.

For a more stripped-down example, there is another sample configuration file ([./config-met.yml](config-met.yml)) that uses a different data source and does not include a guide or stories.

Lastly, you don't need to get it perfect the first time! You can continually re-build your project with updated configuration at any time. You can also create as many config files as you like if you want to try out multiple configurations.

### 3. Building your project

Next you should be able to simply run the following script (with the name of your .yml config file) that will generate your project:

```
python make_app.py -config "config-my-project.yml"
```

Behind the scenes, this script runs a number of other scripts in order:

```
python scaffold.py -config "config-my-project.yml"
python prepare_metadata.py -config "config-my-project.yml"
python prepare_sets.py -config "config-my-project.yml"
python prepare_positions.py -config "config-my-project.yml"
python prepare_textures.py -config "config-my-project.yml"
python prepare_labels.py -config "config-my-project.yml"
python prepare_content.py -config "config-my-project.yml"
```

If you are curious or run into issues, you can run each script individually to debug or see what each script does.

After successfully building your project. Your new app should be found in `./apps/{my-project-name}/` where `my-project-name` is the name of app as defined in your configuration file.

### 4. Viewing and deploying your project

Next, if you have not done so already, install and run a simple web server. A [Node.js](https://nodejs.org/en/) [Express](https://expressjs.com/) server is included in this repository. If you have Node.js installed, you can run:

```
npm install
node server.js 1234
```

Then access your new app at _localhost:1234/apps/my-project-name_ (updated with your specified port and project name)

If you make minor tweaks to your config file, in most cases you can just run `python prepare_content.py -config "config-my-project.yml"` again if you are updating minor things like project description or UI parameters. In general, running individual scripts repeatedly should not cause any problems. You can also run `python make_app.py -config "config-my-project.yml"` again, which will run everything (will take longer.)

#### Customizing your app

Beyond what's available in the config file, you can do some deeper customization by updating or adding files in your ./app/{your-project-name}/ folder. You can add custom css to `./app/{your-project-name}/css/app.css` or custom js in `./app/{your-project-name}/js/app.js`. You can add your own assets, css, and js files anywhere in this folder and update the index.html to include any new files.

#### Deploying your app

The entire app is completely static files, so deployment to any host should be pretty easy. Simply copying the contents of the repository to a simple host is all that is needed. Specifically, the required folders to copy are:

```
./apps/
./audio/
./css/
./fonts/
./img/
./js/
```

If you would like to use [Github Pages](https://pages.github.com/) to host your app, you simply need to enable Pages in your repository settings, then push your code to Github.

## Credits

This prototype is [supported](https://knightfoundation.org/press/releases/shaping-the-future-of-technology-in-museums-knight-invests-750000-in-five-experiments-using-immersive-technology-in-the-arts/) by [The Knight Foundation](https://knightfoundation.org/) and built by the [American Museum of Natural History](https://www.amnh.org/)'s [Science Visualization Group](https://amnh-sciviz.github.io/)

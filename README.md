# Collectionscope

Collectionscope is an open source software engine for visualizing museum collections across time and space in three dimensional space. [Visit our homepage](https://amnh-sciviz.github.io/collectionscope/) for more details about this project.

![A screenshot of the Collectionscope tool](https://amnh-sciviz.github.io/collectionscope/img/amnh_collectionscope.jpg)

You can view a [demo of this tool here](https://amnh-sciviz.github.io/collectionscope/apps/amnh/).

## Who is this software engine for?

Organizations, institutions, and individuals who:

1. have a collection of somewhere between 1,000 and 250,000 items
2. have the following metadata for those items: title, date (can be messy!), location (e.g. country of origin), and image URL
3. have personnel with some data and programming knowledge (see next section)

## Requirements

### Personnel

This software was designed to require minimal technical resources needed to make complex visualizations of collections. However, there is currently no self-serve interface or wizard available, so you will till need personnel with some data and programming knowledge to properly set this up. You will need one or more people who cover all of the following:

1. Someone who is familiar with your data and can prepare a .CSV file with specific metadata (e.g. title, date, location, image URL)
2. Someone who can run (and possibly troubleshoot) [Python](https://www.python.org/) scripts (e.g. a junior programmer or analyst) and edit [Yaml](https://en.wikipedia.org/wiki/YAML) files.
3. Someone who knows how to publish (and optionally customize) a basic static web page (via Github or other host)

### Software

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

### Preparing your data

### Configuring your project

### Building your project

### Viewing and deploying your project

## Extending and modifying this code repository

## License

## Credits

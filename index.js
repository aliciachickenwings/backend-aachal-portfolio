const express = require('express');
const app = express();
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.use(express.json());

const client = new MongoClient(process.env.URL);
let db;

const startServer = async () => {
  try {
    await client.connect();
    db = client.db('Aachal_Portfolio');
    console.log("Connected to database");

    app.listen(3001, () => {
      console.log("App running at http://localhost:3001");
    });
  } catch (err) {
    console.error("Failed to connect to the database", err);
    process.exit(1);
  }
};

startServer();

app.get('/', (req, res) => {
  res.send('got it');
});

// Get all works
app.get('/works', async (req, res) => {
  try {
    const coll = db.collection('Works');
    const allWorks = await coll.find({}).toArray();
    res.status(200).send({
      status: 'OK request',
      message: 'got all works',
      data: allWorks
    });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: 'something went wrong', value: err });
  }
});

// Get work by ID
app.get('/works/:id', async (req, res) => {
  try {
    const workId = new ObjectId(req.params.id);
    const work = await db.collection('Works').aggregate([
      { $match: { _id: workId } },
      {
        $lookup: {
          from: 'Tags',
          localField: 'tags',
          foreignField: '_id',
          as: 'tagDetails'
        }
      }
    ]).toArray();

    if (work.length > 0) {
      res.json(work[0]);
    } else {
      res.status(404).send('Work not found');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching work: ' + err);
  }
});

// POST a work
app.post('/work', async (req, res) => {
  try {
    const { name, description, year, tags, link } = req.body;

    if (!name || !description || !year || !tags || !link) {
      return res.status(400).send('All fields are required.');
    }

    const tagIds = tags.map(tag => new ObjectId(tag));
    const existingTags = await db.collection('Tags').find({ _id: { $in: tagIds } }).toArray();

    if (existingTags.length !== tags.length) {
      return res.status(400).send('One or more tags are invalid.');
    }

    const newWork = {
      name,
      description,
      year,
      tags: tagIds,
      link
    };

    const result = await db.collection('Works').insertOne(newWork);

    res.status(201).send(`Work created with ID: ${result.insertedId}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error creating work: ' + err);
  }
});

// DELETE a work by ID
app.delete('/work/:id', async (req, res) => {
  try {
    const workId = new ObjectId(req.params.id);
    const result = await db.collection('Works').deleteOne({ _id: workId });

    if (result.deletedCount === 1) {
      res.status(200).send(`Work with ID ${workId} deleted successfully.`);
    } else {
      res.status(404).send('Work not found.');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Error deleting work: ' + err);
  }
});

// POST a tag
app.post('/tag', async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).send('Name field is required.');
    }

    const newTag = { name };
    const result = await db.collection('Tags').insertOne(newTag);

    res.status(201).send(`Tag created with ID: ${result.insertedId}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error creating tag: ' + err);
  }
});

// Get tag by ID
app.get('/tag/:id', async (req, res) => {
  try {
    const tagId = new ObjectId(req.params.id);
    const tag = await db.collection('Tags').findOne({ _id: tagId });

    if (tag) {
      res.status(200).json(tag);
    } else {
      res.status(404).send('Tag not found.');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching tag: ' + err);
  }
});

app.get('/archive', async (req, res) => {
  try {
    const coll = db.collection('Archive');
    const archive = await coll.find({}).toArray();
    res.status(200).send({
      status: 'OK request',
      message: 'got archive',
      data: archive
    });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: 'something went wrong', value: err });
  }
});
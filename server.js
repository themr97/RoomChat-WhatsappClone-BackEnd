// importing

import express from 'express';
import mongoose from 'mongoose';
import Messages from './dbMessages.js'
import Pusher from 'pusher';
import cors from 'cors';
//app config

const app = express();
const port = process.env.PORT || 9000


const pusher = new Pusher({
    appId: "1169155",
    key: "3d287fb03da1b3551df6",
    secret: "569df88f3e3e4253b97e",
    cluster: "ap2",
    useTLS: true
});

//middleware
app.use(express.json());
app.use(cors())


//db config
const connection_url = 'mongodb+srv://admin:3ynp6SfeLgeHPYSx@cluster0.e59j9.mongodb.net/whatsappdb?retryWrites=true&w=majority';

mongoose.connect(connection_url, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true
})


// PUSHER CONFIG!

const db = mongoose.connection;

db.once('open', () => {
    console.log('DB connected');

    const msgCollection = db.collection('messagecontents');
    const changeStream = msgCollection.watch();

    changeStream.on('change', (change) => {
        console.log(change);

        if (change.operationType === 'insert') {
            const messageDetails = change.fullDocument;
            pusher.trigger('messages', 'inserted',
                {
                    name: messageDetails.name,
                    message: messageDetails.message,
                    timestamp: messageDetails.timestamp,
                    received: messageDetails.received,
                }
            );

        } else {
            console.log("error triggering pusher")
        }


    })
})

//

//api routes
app.get('/', (req, res) => res.status(200).send("Hello world"));

app.get('/messages/sync', (req, res) => {
    Messages.find((err, data) => {
        if (err) {
            res.status(500).send(err)
        } else {
            res.status(200).send(data)
        }
    })
})

app.post('/messages/new', (req, res) => {
    const dbMessage = req.body

    Messages.create(dbMessage, (err, data) => {
        if (err) {
            res.status(500).send(err)
        } else {
            res.status(201).send(data)
        }
    })
})


// listen
app.listen(port, () => console.log(`Listening on localhost:${port}`));
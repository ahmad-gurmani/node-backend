
import dotenv from 'dotenv';
import connectDB from './db/index.js';

dotenv.config({
    path: "./env"
})

connectDB();








// one way of connecting db
// import mongoose from 'mongoose';
// import { DB_NAME } from "./constants"
// import express from 'express';

// const app = express();


// (async () => {
//     try {
//         await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`)
//         app.on(("error", (err) => {
//             console.log("Error: ", err.message);
//             throw err;
//         }))

//         app.listen(process.env.PORT, () => {
//             console.log(`App listening on ${process.env.PORT}`);
//         })
//     } catch (error) {
//         console.log("Error: ", error);
//     }
// })() 
import mongoose from 'mongoose';

if (!global.mongooseCache) {
    global.mongooseCache = {
        conn: null,
        promise: null
    }
}

const dbConnect = async () => {
    try {
        if (global.mongooseCache.conn) {
            console.log('mongoose connected from cache')
            return global.mongooseCache.conn;
        }


        if (!global.mongooseCache.promise) {
            global.mongooseCache.promise = mongoose.connect(process.env.MONGO_URI as string);
        }

        console.log('mongoose connected again')
        global.mongooseCache.conn = await global.mongooseCache.promise;
        return global.mongooseCache.conn;
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1); // Exit the process with an error code
    }
}

export default dbConnect;
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'

var mongod: MongoMemoryServer

export async function connect (): Promise<typeof mongoose> {
  mongod = await MongoMemoryServer.create()
  const uri = mongod.getUri()
  const mongooseOpts: mongoose.ConnectOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    poolSize: 10
  }
  return await mongoose.connect(uri, mongooseOpts)
}

export async function closeDatabase (): Promise<boolean> {
  if (mongoose.connection !== null) {
    await mongoose.connection.dropDatabase()
    await mongoose.connection.close()
  }
  if (mongod.state !== 'stopped') {
    return await mongod.stop()
  }
  return true
}

export async function clearDatabase (): Promise<void> {
  const collections = mongoose.connection.collections
  for (const key of Object.keys(collections)) {
    const collection = collections[key]
    await collection.deleteMany({})
  }
}

export function getConnection (): mongoose.Connection {
  return mongoose.connection
}

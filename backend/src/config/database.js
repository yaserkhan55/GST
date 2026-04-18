import mongoose from 'mongoose';

let activeConnection = null;
let activeDbLabel = 'disconnected';
let shutdownHandlerRegistered = false;

const connectionOptions = {
  serverSelectionTimeoutMS: 15000,
  family: 4
};

const maskMongoUri = (uri = '') => {
  if (!uri) return 'undefined';

  return uri.replace(
    /(mongodb(?:\+srv)?:\/\/)([^:]+):([^@]+)@/i,
    (_, protocol, username) => `${protocol}${username}:***@`
  );
};

const validateMongoUri = (uri, envKey) => {
  if (!uri) {
    throw new Error(`${envKey} is missing from environment variables`);
  }

  if (!/^mongodb(\+srv)?:\/\/.+/i.test(uri)) {
    throw new Error(`${envKey} must start with mongodb:// or mongodb+srv://`);
  }
};

const registerConnectionEvents = (connection, label) => {
  connection.on('error', (err) => {
    console.error(`[DB:${label}] Error: ${err.message}`);
  });

  connection.on('disconnected', () => {
    console.log(`[DB:${label}] Disconnected`);
  });
};

const ensureShutdownHandler = () => {
  if (shutdownHandlerRegistered) return;

  process.on('SIGINT', async () => {
    if (activeConnection) {
      await activeConnection.close();
      console.log(`[DB:${activeDbLabel}] Connection closed on app termination`);
    }

    process.exit(0);
  });

  shutdownHandlerRegistered = true;
};

const openConnection = async (uri, label, envKey) => {
  validateMongoUri(uri, envKey);
  console.log(`[DB:${label}] Trying ${maskMongoUri(uri)}`);

  const connection = await mongoose.createConnection(uri, connectionOptions).asPromise();
  registerConnectionEvents(connection, label);

  console.log(`[DB:${label}] Connected: ${connection.host}`);
  return connection;
};

export const getActiveConnection = () => {
  if (!activeConnection) {
    throw new Error('Database connection has not been initialized yet');
  }

  return activeConnection;
};

export const getActiveDbLabel = () => activeDbLabel;

export const connectAtlasDB = async () => {
  const atlasUri = (process.env.MONGODB_URI_ATLAS || process.env.MONGODB_URI)?.trim();
  return openConnection(atlasUri, 'atlas', 'MONGODB_URI_ATLAS');
};

export const connectLocalDB = async () => {
  const localUri = (process.env.MONGODB_URI_LOCAL || 'mongodb://localhost:27017/gst_reconciliation').trim();
  return openConnection(localUri, 'local', 'MONGODB_URI_LOCAL');
};

const connectDB = async () => {
  ensureShutdownHandler();

  try {
    activeConnection = await connectAtlasDB();
    activeDbLabel = 'atlas';
    return activeConnection;
  } catch (atlasError) {
    console.error(`[DB:atlas] Connection failed: ${atlasError.message}`);

    if (atlasError.message.includes('querySrv') || atlasError.message.includes('ECONNREFUSED')) {
      console.error('[DB:atlas] SRV/DNS lookup failed. Falling back to local MongoDB.');
    } else {
      console.error('[DB:atlas] Falling back to local MongoDB.');
    }
  }

  try {
    activeConnection = await connectLocalDB();
    activeDbLabel = 'local';
    return activeConnection;
  } catch (localError) {
    activeConnection = null;
    activeDbLabel = 'disconnected';
    console.error(`[DB:local] Connection failed: ${localError.message}`);
    throw new Error(
      `Database startup failed. Atlas and local connections were unavailable. Last local error: ${localError.message}`
    );
  }
};

export default connectDB;

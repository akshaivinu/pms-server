import mongoose from 'mongoose';
import { config } from 'dotenv';
config({ path: 'D:/PROJECTS/pms/pms-server/.env' });
await mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection.db;
const Types = mongoose.Types;

const ORG = new Types.ObjectId('6a99b583ca7313af19789f52');
const USER = '6a9aaa656a48938e6c821f8b';

const memberships = await db.collection('projectmembers').find({ user_id: USER }).project({ project_id: 1 }).toArray();
console.log('memberships:', JSON.stringify(memberships));
const ids = memberships.map(m => m.project_id);
const projects = await db.collection('projects').find({ organization_id: ORG, _id: { $in: ids } }).project({ name: 1, organization_id: 1 }).toArray();
console.log('findAll result:', JSON.stringify(projects));

// check raw types in projects
const raw = await db.collection('projects').find({ _id: { $in: ids } }).toArray();
for (const p of raw) console.log('PROJECT RAW:', p._id, typeof p.organization_id, JSON.stringify(p.organization_id));

await mongoose.disconnect();

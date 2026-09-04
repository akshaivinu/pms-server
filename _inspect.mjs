import mongoose from 'mongoose';
import { config } from 'dotenv';
config({ path: 'D:/PROJECTS/pms/pms-server/.env' });
await mongoose.connect(process.env.MONGO_URI);
const Types = mongoose.Types;

const schema = new mongoose.Schema({
  project_id: { type: Types.ObjectId, ref: 'Project', required: true },
  user_id: { type: Types.ObjectId, ref: 'User', required: true },
  project_role: { type: String, default: 'TEAM_MEMBER' },
}, { timestamps: true });
const PM = mongoose.models.ProjectMember || mongoose.model('ProjectMember', schema);

const pid = new Types.ObjectId('6a9aa8116a48938e6c821f8a');
const uid = '6a9aaa656a48938e6c821f8b';

const one = await PM.findOne({ project_id: pid, user_id: uid }).lean().exec();
console.log('findOne result:', JSON.stringify(one ?? null));

await mongoose.disconnect();

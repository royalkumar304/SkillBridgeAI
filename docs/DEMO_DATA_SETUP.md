# SkillBridge AI — Safe Demo Data Setup Guide
**SIH Problem Statement:** SIH26044 | **Environment:** Development & Evaluation Sandbox

This guide documents how to populate your local MongoDB instance with safe, realistic demonstration data for live presentations.

---

## 1. Demo Credentials Matrix

All accounts use the standardized, memorable password: `Password@123`

| Persona | Role | Email Address | Password | Purpose in Demo |
| :--- | :---: | :--- | :--- | :--- |
| **Aarav Sharma** | `STUDENT` | `student1@skillbridge.edu` | `Password@123` | Complete profile, upload resume, apply to internships |
| **Diya Patel** | `STUDENT` | `student2@skillbridge.edu` | `Password@123` | Peer student testing recipient privacy and isolation |
| **Vikram Malhotra** | `RECRUITER` | `recruiter1@techcorp.com` | `Password@123` | TechCorp verified partner; post jobs/internships |
| **Neha Gupta** | `RECRUITER` | `recruiter2@cloudscale.io` | `Password@123` | CloudScale unverified partner; test approval gate |
| **Dean S. K. Verma** | `UNIVERSITY_ADMIN` | `admin@univ.edu` | `Password@123` | University oversight, approve partners, curriculum gaps |

---

## 2. Automated Idempotent Seed Script

You can create or refresh the demo data at any time without wiping other institutional collections. Run the automated seed command from the repository root:

```powershell
node -e "
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function seed() {
  await mongoose.connect('mongodb://127.0.0.1:27017/skillbridge_ai');
  console.log('Connected to MongoDB. Initializing demo accounts...');

  const User = mongoose.model('User', new mongoose.Schema({
    name: String, email: { type: String, unique: true }, passwordHash: String, role: String, isVerified: Boolean
  }, { timestamps: true }));

  const Company = mongoose.model('Company', new mongoose.Schema({
    name: { type: String, unique: true }, industry: String, location: String, website: String, verified: Boolean, recruiterUserId: mongoose.Schema.Types.ObjectId
  }, { timestamps: true }));

  const pwd = await bcrypt.hash('Password@123', 10);

  // 1. Admin
  let admin = await User.findOne({ email: 'admin@univ.edu' });
  if (!admin) {
    admin = await User.create({ name: 'Dean S. K. Verma', email: 'admin@univ.edu', passwordHash: pwd, role: 'UNIVERSITY_ADMIN', isVerified: true });
    console.log('Created Admin:', admin.email);
  }

  // 2. Verified Recruiter
  let rec1 = await User.findOne({ email: 'recruiter1@techcorp.com' });
  if (!rec1) {
    rec1 = await User.create({ name: 'Vikram Malhotra', email: 'recruiter1@techcorp.com', passwordHash: pwd, role: 'RECRUITER', isVerified: true });
    console.log('Created Recruiter 1:', rec1.email);
  }
  let comp1 = await Company.findOne({ name: 'TechCorp Solutions' });
  if (!comp1) {
    comp1 = await Company.create({ name: 'TechCorp Solutions', industry: 'Cloud & Enterprise AI', location: 'Bengaluru / Remote', website: 'https://techcorp.example.com', verified: true, recruiterUserId: rec1._id });
    console.log('Created Company 1 (Verified):', comp1.name);
  }

  // 3. Unverified Recruiter
  let rec2 = await User.findOne({ email: 'recruiter2@cloudscale.io' });
  if (!rec2) {
    rec2 = await User.create({ name: 'Neha Gupta', email: 'recruiter2@cloudscale.io', passwordHash: pwd, role: 'RECRUITER', isVerified: false });
    console.log('Created Recruiter 2:', rec2.email);
  }
  let comp2 = await Company.findOne({ name: 'CloudScale Technologies' });
  if (!comp2) {
    comp2 = await Company.create({ name: 'CloudScale Technologies', industry: 'Distributed Systems', location: 'Hyderabad / Hybrid', website: 'https://cloudscale.example.com', verified: false, recruiterUserId: rec2._id });
    console.log('Created Company 2 (Unverified):', comp2.name);
  }

  // 4. Students
  let s1 = await User.findOne({ email: 'student1@skillbridge.edu' });
  if (!s1) {
    s1 = await User.create({ name: 'Aarav Sharma', email: 'student1@skillbridge.edu', passwordHash: pwd, role: 'STUDENT', isVerified: true });
    console.log('Created Student 1:', s1.email);
  }

  let s2 = await User.findOne({ email: 'student2@skillbridge.edu' });
  if (!s2) {
    s2 = await User.create({ name: 'Diya Patel', email: 'student2@skillbridge.edu', passwordHash: pwd, role: 'STUDENT', isVerified: true });
    console.log('Created Student 2:', s2.email);
  }

  console.log('Demo seed completed successfully.');
  process.exit(0);
}

seed().catch(err => { console.error('Seed error:', err); process.exit(1); });
"
```

---

## 3. Demo Reset & Hygiene Rules

- The seed script is strictly **idempotent**: running it multiple times will safely update existing records without creating duplicate users.
- Never use real personal passwords or institutional credentials during live demonstrations.
- To clear temporary test job applications while preserving demo user accounts, delete test documents from MongoDB using the `_id` selectors.

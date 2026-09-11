import { User, Listing, LookingFor, KnowledgePost, Interest, Handover, Notification, Match } from '../types';

export const MOCK_USERS: User[] = [
  {
    id: 'user-rahul',
    name: 'Rahul Sharma',
    email: 'rahul.s@vnrvjiet.in',
    branch: 'Computer Science & Engineering',
    batch: '4th Year (2022-2026)',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    bio: '4th Year CSE student. Passing forward academic books and lab equipment to juniors.',
    role: 'student',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'user-ananya',
    name: 'Ananya Reddy',
    email: 'ananya.r@vnrvjiet.in',
    branch: 'Computer Science & Engineering',
    batch: '2nd Year (2024-2028)',
    avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    bio: '2nd Year CSE student looking for calculators, lab gear, and project components.',
    role: 'student',
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: 'user-vikram',
    name: 'Vikram Verma',
    email: 'vikram.v@vnrvjiet.in',
    branch: 'Electrical & Electronics Engineering',
    batch: '4th Year (2022-2026)',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    bio: 'EEE 4th Year student. Interested in robotics and IoT project component sharing.',
    role: 'student',
    created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
  },
  {
    id: 'user-priya',
    name: 'Priya Rao',
    email: 'priya.r@vnrvjiet.in',
    branch: 'Electronics & Communication Engineering',
    batch: '3rd Year (2023-2027)',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    bio: '3rd Year ECE student sharing reference books and project guidance.',
    role: 'student',
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    id: 'user-sneha',
    name: 'Sneha Patel',
    email: 'sneha.p@vnrvjiet.in',
    branch: 'Mechanical Engineering',
    batch: '2nd Year (2024-2028)',
    avatar_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    bio: 'Mechanical Engineering 2nd Year student.',
    role: 'student',
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: 'user-admin',
    name: 'VNR Admin Moderator',
    email: 'admin@passon.vnrvjiet.ac.in',
    branch: 'Campus Administration',
    batch: 'Faculty Staff',
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    bio: 'PassOn Campus Safety & Community Moderation Team.',
    role: 'admin',
    created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
  },
];

export const MOCK_LISTINGS: Listing[] = [];

export const MOCK_LOOKING_FOR: LookingFor[] = [
  {
    id: 'req-1',
    student_id: 'user-ananya',
    student: MOCK_USERS[1],
    title: 'Looking for a scientific calculator',
    category: 'Academic',
    description: 'Need a used scientific calculator (Casio 991EX or 82MS) for M3 exam preparation next week.',
    mode: 'EXCHANGE',
    status: 'OPEN',
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 'req-2',
    student_id: 'user-ananya',
    student: MOCK_USERS[1],
    title: 'Need engineering mathematics reference books',
    category: 'Books',
    description: 'Looking for BS Grewal or NP Bali Engineering Mathematics reference textbook.',
    mode: 'DONATE',
    status: 'OPEN',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'req-3',
    student_id: 'user-ananya',
    student: MOCK_USERS[1],
    title: 'Looking for an Arduino kit for project',
    category: 'Project',
    description: 'Require an Arduino project kit with basic sensors for mini-project presentation.',
    mode: 'BUY',
    status: 'OPEN',
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
];

export const MOCK_KNOWLEDGE_POSTS: KnowledgePost[] = [
  {
    id: 'post-1',
    author_id: 'user-rahul',
    author: MOCK_USERS[0],
    title: 'How I prepared for placement coding rounds & tech interviews',
    category: 'Placement',
    content: `Here is the roadmap that helped me secure campus offers during VNR placement season:

### 1. Data Structures & Algorithms (DSA)
- Master Arrays, Strings, Hashing, Two Pointers, and Trees first.
- Solve the LeetCode 75 or Striver's A2Z sheet. Focus on problem patterns rather than memorizing solutions.
- Practice timed contests on CodeChef/LeetCode to build speed for online assessments (OA).

### 2. Core CS Fundamentals
- **Operating Systems**: Processes, Threads, CPU Scheduling, Deadlocks, Paging.
- **DBMS**: SQL Queries (Joins, Indexing, Group By), Normalization (1NF to BCNF), ACID properties.
- **Computer Networks**: OSI Layers, TCP vs UDP, HTTP/HTTPS, DNS resolution steps.

### 3. Project Presentation
- Be ready to explain every single architecture decision in your final year project.
- Highlight your individual contribution, technical challenges faced, and how you resolved performance bottlenecks.

### Mistakes I Made
- Waiting too long before starting mock interviews.
- Neglecting SQL queries until the last week.

### Advice for Juniors
Start mock interviews with batchmates early in 3rd year 2nd sem. Good luck!`,
    tags: ['Placement', 'DSA', 'Interview Prep', 'CSE', 'Career'],
    useful_count: 42,
    status: 'PUBLISHED',
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: 'post-2',
    author_id: 'user-vikram',
    author: MOCK_USERS[2],
    title: 'What I wish I knew before my first campus hackathon',
    category: 'Hackathons',
    content: `Hackathons at VNR and inter-college tech fests are super rewarding if approached strategically:

1. **Keep the Scope Realistic**: Build a tight, working end-to-end prototype rather than half-finished complex features.
2. **Design First**: Spend the first 2 hours mapping database schema and UI wireframes.
3. **Pitch Deck Matters**: Judges evaluate Problem Statement, Live Demo, and Tech Stack clarity. Allocate 1 hour for presentation prep.
4. **Hardware Kits**: If doing IoT/Robotics, test sensor wiring and library compatibility before hackathon day!`,
    tags: ['Hackathons', 'IoT', 'Projects', 'Tips', 'VNR Fests'],
    useful_count: 28,
    status: 'PUBLISHED',
    created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 8 * 86400000).toISOString(),
  },
  {
    id: 'post-3',
    author_id: 'user-rahul',
    author: MOCK_USERS[0],
    title: 'Final year project mistakes to avoid (and how to pick a topic)',
    category: 'Projects',
    content: `Choosing and completing your major project smoothly:

- **Avoid generic topics**: Instead of "E-Commerce Store", build campus-focused or domain-specific utility systems like PassOn.
- **Guide Alignment**: Discuss project feasibility with your department guide in 3rd year 2nd sem.
- **Documentation**: Write your IEEE/ACM paper draft alongside coding, not after the project is finished!`,
    tags: ['Projects', 'Major Project', 'IEEE', 'Guide Tips'],
    useful_count: 35,
    status: 'PUBLISHED',
    created_at: new Date(Date.now() - 6 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 6 * 86400000).toISOString(),
  },
  {
    id: 'post-4',
    author_id: 'user-priya',
    author: MOCK_USERS[3],
    title: 'Useful campus tips & study strategies for VNR juniors',
    category: 'Campus Life',
    content: `Simple habits to maintain a high CGPA while active in campus clubs:

- **Library Resources**: The central library digital portal gives free access to IEEE journals and reference ebooks.
- **Mid-Exam Notes**: Keep concise formula sheets after every unit completion.
- **Attendance**: Maintain >75% attendance easily by being consistent in the first half of the semester.`,
    tags: ['Campus Life', 'Library', 'CGPA', 'VNR Tips'],
    useful_count: 19,
    status: 'PUBLISHED',
    created_at: new Date(Date.now() - 12 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 12 * 86400000).toISOString(),
  },
  {
    id: 'post-5',
    author_id: 'user-sneha',
    author: MOCK_USERS[4],
    title: 'How to balance academics, lab work, and practical projects',
    category: 'Academics',
    content: `Managing lab manuals, assignments, and personal learning without stress:

- Finish lab records on the day of the experiment while observations are fresh.
- Form 3-person peer study groups for weekly problem solving.
- Utilize weekend campus makerspaces for hands-on project builds.`,
    tags: ['Academics', 'Labs', 'Time Management'],
    useful_count: 14,
    status: 'PUBLISHED',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
];

export const MOCK_INTERESTS: Interest[] = [];

export const MOCK_NOTIFICATIONS: Notification[] = [];

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const { User, ROLES } = require('../models/User');
const { Post } = require('../models/Post');
const Comment = require('../models/Comment');

const seedBlogContent = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { family: 4 });
    console.log('✅ Connected to MongoDB');

    // ── Create new author ──────────────────────────────────────────────────────
    let author = await User.findOne({ email: 'alex.morgan@blogspace.com' });
    if (!author) {
      author = await User.create({
        name: 'Alex Morgan',
        email: 'alex.morgan@blogspace.com',
        password: 'Author123!',
        role: ROLES.AUTHOR,
        bio: 'Senior software engineer and tech writer. I write about web development, AI, and the future of technology. 10+ years building products people love.',
        isActive: true,
      });
      console.log('✅ Author created: alex.morgan@blogspace.com / Author123!');
    } else {
      console.log('ℹ️  Author already exists');
    }

    // ── Create commenters ──────────────────────────────────────────────────────
    const commenterData = [
      { name: 'Sarah Chen', email: 'sarah.chen@demo.com', bio: 'Frontend developer & UI enthusiast' },
      { name: 'Marcus Williams', email: 'marcus.w@demo.com', bio: 'Full-stack developer, coffee addict' },
      { name: 'Priya Patel', email: 'priya.p@demo.com', bio: 'DevOps engineer & open source contributor' },
      { name: 'James O\'Brien', email: 'james.ob@demo.com', bio: 'CS student & aspiring developer' },
    ];

    const commenters = [];
    for (const cd of commenterData) {
      let u = await User.findOne({ email: cd.email });
      if (!u) {
        u = await User.create({ ...cd, password: 'Reader123!', role: ROLES.READER, isActive: true });
      }
      commenters.push(u);
    }
    console.log(`✅ ${commenters.length} commenters ready`);

    // ── Blog posts ─────────────────────────────────────────────────────────────
    const posts = [
      {
        title: 'Why TypeScript is the Best Thing That Happened to JavaScript',
        content: `<h2>The JavaScript Problem</h2>
<p>JavaScript is the world's most popular programming language — and also one of the most frustrating. For years, developers have battled cryptic runtime errors, mysterious <code>undefined is not a function</code> messages, and codebases that become impossible to maintain as they grow. TypeScript changed all of that.</p>

<h2>What TypeScript Actually Does</h2>
<p>TypeScript is a superset of JavaScript that adds static type checking. This means you catch errors at compile time — before your code ever runs — rather than discovering them in production at 2am when your phone is blowing up.</p>
<p>Consider this simple example. In JavaScript, nothing stops you from doing:</p>
<pre><code>function greet(user) {
  return "Hello, " + user.naem; // typo: naem instead of name
}</code></pre>
<p>TypeScript catches this immediately. The compiler tells you exactly what's wrong, where it is, and how to fix it.</p>

<h2>The Real Benefits in Production</h2>
<p>After migrating three large codebases to TypeScript, here's what I've observed:</p>
<ul>
<li><strong>40% fewer runtime bugs</strong> — type errors caught at compile time never reach users</li>
<li><strong>Faster onboarding</strong> — new developers understand code structure immediately from types</li>
<li><strong>Fearless refactoring</strong> — change a function signature and TypeScript tells you every place that breaks</li>
<li><strong>Better IDE support</strong> — autocomplete actually works, navigation is instant</li>
</ul>

<h2>The Migration Path</h2>
<p>You don't have to rewrite everything at once. TypeScript's <code>allowJs</code> option lets you migrate file by file. Start with your most critical utilities, then work outward. Most teams see full ROI within 3 months.</p>

<h2>Conclusion</h2>
<p>TypeScript isn't just a trend — it's become the standard for serious JavaScript development. If you're still writing plain JavaScript for anything beyond small scripts, you're leaving productivity and reliability on the table. The learning curve is gentle, the tooling is excellent, and the benefits compound over time.</p>`,
        excerpt: 'After migrating three large codebases to TypeScript, here\'s what I learned about why static typing transforms JavaScript development.',
        tags: ['typescript', 'javascript', 'webdev'],
        coverImage: 'https://picsum.photos/seed/typescript2024/1200/630',
        status: 'published',
      },
      {
        title: 'Building Real-Time Features with WebSockets: A Practical Guide',
        content: `<h2>When REST Isn't Enough</h2>
<p>REST APIs are great for most things — fetching data, submitting forms, CRUD operations. But some features fundamentally require real-time communication: live chat, collaborative editing, stock tickers, multiplayer games, live notifications. For these, WebSockets are the answer.</p>

<h2>How WebSockets Work</h2>
<p>Unlike HTTP where the client always initiates requests, WebSockets establish a persistent, bidirectional connection. Once the handshake is complete, both the server and client can send messages at any time without the overhead of repeated HTTP headers.</p>
<p>The connection lifecycle looks like this:</p>
<ol>
<li>Client sends an HTTP upgrade request</li>
<li>Server responds with 101 Switching Protocols</li>
<li>Both sides can now send frames freely</li>
<li>Either side can close the connection with a close frame</li>
</ol>

<h2>Building a Live Notification System</h2>
<p>Here's a minimal but production-ready WebSocket server using Node.js and the <code>ws</code> library:</p>
<pre><code>const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

const clients = new Map();

wss.on('connection', (ws, req) => {
  const userId = getUserIdFromRequest(req);
  clients.set(userId, ws);
  
  ws.on('close', () => clients.delete(userId));
});

// Send notification to specific user
function notify(userId, data) {
  const client = clients.get(userId);
  if (client?.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify(data));
  }
}</code></pre>

<h2>Handling Reconnection</h2>
<p>Networks are unreliable. Your WebSocket client must handle disconnections gracefully with exponential backoff:</p>
<ul>
<li>First retry: 1 second</li>
<li>Second retry: 2 seconds</li>
<li>Third retry: 4 seconds</li>
<li>Cap at 30 seconds to avoid hammering the server</li>
</ul>

<h2>Scaling WebSockets</h2>
<p>A single Node.js process can handle ~10,000 concurrent WebSocket connections. Beyond that, you need horizontal scaling with a pub/sub layer like Redis to broadcast messages across multiple server instances.</p>

<h2>When to Use WebSockets vs. SSE vs. Polling</h2>
<p>Use WebSockets for bidirectional communication. Use Server-Sent Events (SSE) for one-way server-to-client streams — they're simpler and work over standard HTTP. Use polling only as a last resort when WebSockets aren't available.</p>`,
        excerpt: 'A practical guide to building real-time features with WebSockets — from the basics to production-ready patterns for scaling.',
        tags: ['websockets', 'nodejs', 'realtime'],
        coverImage: 'https://picsum.photos/seed/websockets2024/1200/630',
        status: 'published',
      },
      {
        title: 'CSS Grid vs Flexbox: When to Use Which (With Real Examples)',
        content: `<h2>The Eternal Debate</h2>
<p>Every CSS developer has faced this question: should I use Grid or Flexbox? The answer isn't one or the other — they solve different problems. Understanding when to reach for each tool will make you dramatically faster at building layouts.</p>

<h2>The Core Difference</h2>
<p>Here's the mental model that changed how I think about this:</p>
<ul>
<li><strong>Flexbox</strong> is one-dimensional — it works along a single axis (row OR column)</li>
<li><strong>CSS Grid</strong> is two-dimensional — it works along both axes simultaneously (rows AND columns)</li>
</ul>
<p>That's it. Everything else follows from this distinction.</p>

<h2>When Flexbox Wins</h2>
<p>Flexbox excels at distributing items along a single axis with flexible sizing:</p>
<ul>
<li>Navigation bars with items that need to fill available space</li>
<li>Card footers where you want one item pushed to the right</li>
<li>Centering a single element both horizontally and vertically</li>
<li>Wrapping items that should flow naturally</li>
</ul>
<pre><code>/* Perfect flexbox use case: navbar */
.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}</code></pre>

<h2>When Grid Wins</h2>
<p>Grid shines when you need precise two-dimensional control:</p>
<ul>
<li>Page layouts with header, sidebar, main content, footer</li>
<li>Image galleries with consistent sizing</li>
<li>Dashboard layouts with multiple panels</li>
<li>Any layout where items need to align across both rows and columns</li>
</ul>
<pre><code>/* Perfect grid use case: dashboard layout */
.dashboard {
  display: grid;
  grid-template-columns: 250px 1fr;
  grid-template-rows: 64px 1fr;
  min-height: 100vh;
}</code></pre>

<h2>The Rule of Thumb</h2>
<p>Start with the content. If your items flow naturally in one direction and you just need to control spacing and alignment along that axis — use Flexbox. If you're designing a layout where items need to align in two dimensions — use Grid. And remember: you can nest them. A Grid layout can contain Flex containers and vice versa.</p>

<h2>The Modern Approach</h2>
<p>In 2024, both are fully supported everywhere. Stop worrying about browser compatibility and start using the right tool for each job. Your layouts will be cleaner, your CSS will be shorter, and your colleagues will thank you.</p>`,
        excerpt: 'Stop guessing which layout tool to use. Here\'s the definitive mental model for choosing between CSS Grid and Flexbox with real-world examples.',
        tags: ['css', 'frontend', 'webdev'],
        coverImage: 'https://picsum.photos/seed/cssgrid2024/1200/630',
        status: 'published',
      },
      {
        title: 'The Art of Writing Clean Code: Principles Every Developer Should Know',
        content: `<h2>What Is Clean Code, Really?</h2>
<p>Clean code is code that reads like well-written prose. It's code that another developer — or your future self six months from now — can understand without a decoder ring. Robert C. Martin put it best: "Clean code is code that has been taken care of."</p>

<h2>Naming Is Everything</h2>
<p>The single most impactful thing you can do for code quality is choose better names. A good name eliminates the need for a comment. Compare:</p>
<pre><code>// Bad
const d = new Date();
const x = u.filter(i => i.a > 30);

// Good  
const currentDate = new Date();
const activeUsersOverThirty = users.filter(user => user.age > 30);</code></pre>
<p>The second version needs no explanation. The code IS the documentation.</p>

<h2>Functions Should Do One Thing</h2>
<p>The Single Responsibility Principle applies to functions too. A function that does one thing is easy to name, easy to test, and easy to reuse. If you find yourself writing "and" in a function name — <code>validateAndSaveUser</code> — that's a sign it should be two functions.</p>

<h2>The Boy Scout Rule</h2>
<p>Leave the code cleaner than you found it. You don't have to refactor an entire module every time you touch it. Just make one small improvement: rename a confusing variable, extract a magic number into a constant, add a missing edge case check. These small improvements compound over time.</p>

<h2>Comments Are a Last Resort</h2>
<p>Good code rarely needs comments. When you feel the urge to write a comment, ask yourself: can I make the code itself clearer instead? Comments lie — they get out of sync with the code they describe. The code always tells the truth.</p>
<p>The exceptions: explaining <em>why</em> something is done a non-obvious way, documenting public APIs, and marking intentional workarounds with ticket numbers.</p>

<h2>Error Handling Is Not Optional</h2>
<p>Unhandled errors are bugs waiting to happen. Every function that can fail should either handle the failure or explicitly propagate it. Never silently swallow exceptions. Your users deserve meaningful error messages, and your team deserves stack traces.</p>

<h2>The Bigger Picture</h2>
<p>Clean code isn't about following rules — it's about empathy. Empathy for the next developer who reads your code, empathy for your users who depend on it working correctly, and empathy for your future self who will maintain it. Write code as if the person maintaining it is a violent psychopath who knows where you live.</p>`,
        excerpt: 'Clean code is about empathy — for your teammates, your users, and your future self. Here are the principles that actually matter.',
        tags: ['cleancode', 'programming', 'bestpractices'],
        coverImage: 'https://picsum.photos/seed/cleancode2024/1200/630',
        status: 'published',
      },
      {
        title: 'Docker for Developers: From Zero to Production in One Guide',
        content: `<h2>Why Docker Changed Everything</h2>
<p>"It works on my machine" — four words that have ended careers, delayed launches, and caused countless late-night debugging sessions. Docker solved this problem by packaging your application and all its dependencies into a portable container that runs identically everywhere.</p>

<h2>Containers vs Virtual Machines</h2>
<p>A common misconception is that containers are just lightweight VMs. They're fundamentally different. VMs virtualize hardware and run a full OS. Containers share the host OS kernel and only package the application and its dependencies. This makes containers start in milliseconds instead of minutes and use megabytes instead of gigabytes.</p>

<h2>Your First Dockerfile</h2>
<p>A Dockerfile is a recipe for building a container image. Here's a production-ready Node.js Dockerfile:</p>
<pre><code>FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies first (better layer caching)
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Run as non-root user for security
USER node

EXPOSE 3000
CMD ["node", "server.js"]</code></pre>
<p>Every line matters. <code>alpine</code> keeps the image small. Copying <code>package.json</code> before source code means Docker caches the dependency layer — rebuilds are fast unless you change dependencies.</p>

<h2>Docker Compose for Local Development</h2>
<p>Running your app alongside a database, Redis, and other services is where Docker Compose shines:</p>
<pre><code>services:
  app:
    build: .
    ports: ["3000:3000"]
    environment:
      - DATABASE_URL=mongodb://mongo:27017/myapp
    depends_on: [mongo]
  
  mongo:
    image: mongo:7
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:</code></pre>
<p>One command — <code>docker compose up</code> — starts your entire stack. New team members are productive in minutes, not hours.</p>

<h2>Production Best Practices</h2>
<ul>
<li><strong>Multi-stage builds</strong> — separate build and runtime stages to minimize image size</li>
<li><strong>Never run as root</strong> — use a non-root user in production containers</li>
<li><strong>Health checks</strong> — let orchestrators know when your container is ready</li>
<li><strong>Immutable tags</strong> — never use <code>latest</code> in production, always pin versions</li>
<li><strong>Secrets management</strong> — never bake secrets into images, use environment variables or secret stores</li>
</ul>

<h2>The Path Forward</h2>
<p>Once you're comfortable with Docker, the next step is Kubernetes for orchestrating containers at scale. But don't rush there — Docker Compose handles most use cases beautifully, and premature optimization is the root of all evil. Master the fundamentals first.</p>`,
        excerpt: 'From "it works on my machine" to production-ready containers — a complete guide to Docker for developers who want to ship with confidence.',
        tags: ['docker', 'devops', 'backend'],
        coverImage: 'https://picsum.photos/seed/docker2024/1200/630',
        status: 'published',
      },
    ];

    // ── Comments per post ──────────────────────────────────────────────────────
    const commentSets = [
      // TypeScript post
      [
        { user: 0, text: 'This is exactly the article I needed to share with my team. We\'ve been debating TypeScript adoption for months and the "40% fewer runtime bugs" stat is compelling. Do you have a source for that?' },
        { user: 1, text: 'Migrated our 80k line codebase to TypeScript last year. The onboarding improvement alone was worth it — new devs are productive in days instead of weeks. Great write-up!' },
        { user: 2, text: 'The allowJs migration path is underrated. We did it incrementally over 6 months and it was completely painless. No big bang rewrite needed.' },
        { user: 3, text: 'Question: do you recommend strict mode from the start or ease into it? We tried strict mode immediately and it was overwhelming.' },
      ],
      // WebSockets post
      [
        { user: 1, text: 'The exponential backoff section is gold. So many tutorials skip reconnection logic entirely and then people wonder why their apps break in production.' },
        { user: 0, text: 'Have you tried Socket.io vs raw WebSockets? I\'ve been going back and forth on whether the abstraction is worth the overhead.' },
        { user: 3, text: 'The Redis pub/sub scaling pattern is exactly what we needed for our notification system. Implemented it last week and it\'s working beautifully.' },
        { user: 2, text: 'Great comparison of WebSockets vs SSE vs polling at the end. Most articles just say "use WebSockets" without explaining the tradeoffs.' },
      ],
      // CSS Grid post
      [
        { user: 2, text: 'The one-dimensional vs two-dimensional mental model is the clearest explanation I\'ve ever read. I\'ve been using both for years and never thought about it that way.' },
        { user: 0, text: 'Finally someone explains this properly! I\'ve been using Flexbox for everything out of habit. Going to start reaching for Grid more for page layouts.' },
        { user: 3, text: 'The nested Grid + Flex approach is what I use for all my projects now. Grid for the macro layout, Flexbox for the micro components. Works perfectly.' },
        { user: 1, text: 'Would love a follow-up post on CSS subgrid — it\'s a game changer for aligning items across nested grid containers.' },
      ],
      // Clean Code post
      [
        { user: 3, text: '"Write code as if the person maintaining it is a violent psychopath who knows where you live" 😂 I\'m putting this on a poster in our office.' },
        { user: 1, text: 'The naming section resonates so much. I spent 20 minutes last week trying to understand what a variable called "data2" was supposed to contain. Please, just use descriptive names.' },
        { user: 0, text: 'The Boy Scout Rule is something I try to practice every PR. Even just renaming one confusing variable makes a difference over time.' },
        { user: 2, text: 'Strong agree on comments being a last resort. I\'ve seen codebases where every line has a comment and it\'s actually harder to read than no comments at all.' },
      ],
      // Docker post
      [
        { user: 0, text: 'The multi-stage build tip is crucial for production. Our Node.js image went from 1.2GB to 180MB after implementing it. Deployment times dropped significantly.' },
        { user: 2, text: 'Docker Compose for local dev is a game changer. Our team went from "spend half a day setting up your environment" to "clone and run docker compose up". Life changing.' },
        { user: 1, text: 'The "never use latest in production" advice cannot be stressed enough. We had a production incident because an upstream image updated and broke our build. Always pin versions!' },
        { user: 3, text: 'Great intro! One thing I\'d add: .dockerignore is just as important as .gitignore. Forgetting it can accidentally include node_modules or .env files in your image.' },
      ],
    ];

    let postsCreated = 0;
    let commentsCreated = 0;

    for (let i = 0; i < posts.length; i++) {
      const postData = posts[i];

      // Skip if already exists
      const existing = await Post.findOne({ title: postData.title });
      if (existing) {
        console.log(`ℹ️  Post already exists: "${postData.title.substring(0, 50)}..."`);
        continue;
      }

      // Create post
      const post = await Post.create({ ...postData, author: author._id });
      postsCreated++;
      console.log(`✅ Post created: "${post.title.substring(0, 50)}..."`);

      // Add comments
      const commentSet = commentSets[i];
      for (const c of commentSet) {
        await Comment.create({
          post: post._id,
          author: commenters[c.user]._id,
          content: c.text,
        });
        commentsCreated++;
      }
      console.log(`   💬 Added ${commentSet.length} comments`);
    }

    console.log(`\n✅ Seeding complete!`);
    console.log(`   Posts created: ${postsCreated}`);
    console.log(`   Comments created: ${commentsCreated}`);
    console.log(`\n📝 New author credentials:`);
    console.log(`   Email: alex.morgan@blogspace.com`);
    console.log(`   Password: Author123!`);
    console.log(`\n👥 Commenter accounts (all use password: Reader123!):`);
    commenterData.forEach(c => console.log(`   ${c.name}: ${c.email}`));

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    process.exit(1);
  }
};

seedBlogContent();

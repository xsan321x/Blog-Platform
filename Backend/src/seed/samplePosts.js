require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const { User, ROLES } = require('../models/User');
const { Post } = require('../models/Post');

/**
 * Seed sample posts for demo purposes
 * Run with: node src/seed/samplePosts.js
 */
const seedSamplePosts = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get or create an author user
    let author = await User.findOne({ email: 'author@demo.com' });
    if (!author) {
      author = await User.create({
        name: 'Jane Writer',
        email: 'author@demo.com',
        password: 'Author123!',
        role: ROLES.AUTHOR,
        bio: 'Passionate writer and tech enthusiast. I write about web development, AI, and the future of technology.',
      });
      console.log('✅ Demo author created: author@demo.com / Author123!');
    }

    const samplePosts = [
      {
        title: 'The Future of Web Development in 2024',
        content: `<h2>Introduction</h2><p>Web development is evolving at an unprecedented pace. From the rise of AI-powered tools to the maturation of edge computing, developers today have more powerful options than ever before.</p><h2>Key Trends</h2><p>The landscape of web development continues to shift dramatically. Here are the most important trends shaping our industry:</p><ul><li><strong>AI-Assisted Development</strong>: Tools like GitHub Copilot and ChatGPT are transforming how we write code</li><li><strong>Edge Computing</strong>: Moving computation closer to users for better performance</li><li><strong>Web Components</strong>: Framework-agnostic components are gaining traction</li><li><strong>TypeScript Everywhere</strong>: Type safety is no longer optional for serious projects</li></ul><h2>The Rise of Full-Stack Frameworks</h2><p>Next.js, Remix, and SvelteKit have redefined what it means to build a full-stack application. The lines between frontend and backend continue to blur, enabling smaller teams to build more powerful applications.</p><h2>Conclusion</h2><p>The future of web development is bright. Embrace the new tools, stay curious, and keep building amazing things.</p>`,
        tags: ['webdev', 'technology', 'trends'],
        coverImage: 'https://picsum.photos/seed/webdev/1200/630',
        status: 'published',
      },
      {
        title: 'Building Scalable APIs with Node.js and Express',
        content: `<h2>Why Node.js for APIs?</h2><p>Node.js has become the go-to choice for building high-performance APIs. Its non-blocking I/O model makes it perfect for handling thousands of concurrent connections.</p><h2>Project Structure</h2><p>A well-organized project structure is crucial for maintainability. Here's a pattern that scales well:</p><ul><li><strong>Controllers</strong>: Handle HTTP requests and responses</li><li><strong>Services</strong>: Contain business logic</li><li><strong>Models</strong>: Define data schemas</li><li><strong>Middleware</strong>: Cross-cutting concerns like auth and validation</li></ul><h2>Security Best Practices</h2><p>Security should never be an afterthought. Always validate input, use parameterized queries, implement rate limiting, and keep your dependencies updated.</p><h2>Performance Tips</h2><p>Use connection pooling, implement caching with Redis, and consider using a CDN for static assets. Monitor your API with tools like New Relic or Datadog.</p>`,
        tags: ['nodejs', 'api', 'backend'],
        coverImage: 'https://picsum.photos/seed/nodejs/1200/630',
        status: 'published',
      },
      {
        title: 'Mastering React Hooks: A Complete Guide',
        content: `<h2>What Are Hooks?</h2><p>React Hooks, introduced in React 16.8, allow you to use state and other React features in functional components. They've fundamentally changed how we write React applications.</p><h2>Essential Hooks</h2><p>Let's explore the most important hooks you'll use daily:</p><ul><li><strong>useState</strong>: Manage local component state</li><li><strong>useEffect</strong>: Handle side effects and lifecycle events</li><li><strong>useContext</strong>: Access context without prop drilling</li><li><strong>useReducer</strong>: Complex state management</li><li><strong>useMemo & useCallback</strong>: Performance optimization</li></ul><h2>Custom Hooks</h2><p>The real power of hooks comes from composability. Custom hooks let you extract and reuse stateful logic across components. A well-designed custom hook can dramatically simplify your components.</p><h2>Common Pitfalls</h2><p>Watch out for stale closures, infinite re-render loops, and missing dependencies in useEffect. The React DevTools and ESLint plugin for hooks are invaluable for catching these issues early.</p>`,
        tags: ['react', 'javascript', 'frontend'],
        coverImage: 'https://picsum.photos/seed/react/1200/630',
        status: 'published',
      },
      {
        title: 'Introduction to TypeScript: Why You Should Make the Switch',
        content: `<h2>The Case for TypeScript</h2><p>TypeScript has gone from a niche tool to an industry standard. Major companies like Microsoft, Google, and Airbnb have adopted it, and for good reason.</p><h2>Key Benefits</h2><p>TypeScript offers several compelling advantages over plain JavaScript:</p><ul><li><strong>Catch errors at compile time</strong>: Find bugs before they reach production</li><li><strong>Better IDE support</strong>: Autocomplete, refactoring, and navigation</li><li><strong>Self-documenting code</strong>: Types serve as inline documentation</li><li><strong>Safer refactoring</strong>: Confidently change code knowing the compiler has your back</li></ul><h2>Getting Started</h2><p>The migration from JavaScript to TypeScript doesn't have to be all-or-nothing. You can gradually add types to your existing codebase, starting with the most critical parts.</p><h2>Advanced Features</h2><p>Once you're comfortable with the basics, explore generics, utility types, conditional types, and template literal types. These features unlock powerful patterns that make your code more expressive and safer.</p>`,
        tags: ['typescript', 'javascript', 'programming'],
        coverImage: 'https://picsum.photos/seed/typescript/1200/630',
        status: 'published',
      },
      {
        title: 'MongoDB Best Practices for Production Applications',
        content: `<h2>Schema Design Matters</h2><p>Unlike relational databases, MongoDB gives you flexibility in schema design. But with great power comes great responsibility. Poor schema design is the #1 cause of performance issues in MongoDB applications.</p><h2>Indexing Strategy</h2><p>Indexes are crucial for query performance. Always index fields you query frequently, but be mindful that indexes consume memory and slow down writes. Use the explain() method to analyze query performance.</p><h2>Aggregation Pipeline</h2><p>The aggregation pipeline is one of MongoDB's most powerful features. It allows you to process and transform data in complex ways, all within the database layer.</p><h2>Connection Pooling</h2><p>Always use connection pooling in production. Mongoose handles this automatically, but make sure you configure the pool size appropriately for your workload.</p><h2>Backup and Recovery</h2><p>Never skip backups. Use MongoDB Atlas for managed backups, or set up mongodump for self-hosted deployments. Test your recovery procedures regularly.</p>`,
        tags: ['mongodb', 'database', 'backend'],
        coverImage: 'https://picsum.photos/seed/mongodb/1200/630',
        status: 'published',
      },
    ];

    let created = 0;
    for (const postData of samplePosts) {
      const existing = await Post.findOne({ title: postData.title });
      if (!existing) {
        await Post.create({ ...postData, author: author._id });
        created++;
      }
    }

    console.log(`✅ Created ${created} sample posts`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    process.exit(1);
  }
};

seedSamplePosts();

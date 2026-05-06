'use client';

import Link from 'next/link';
import { ArrowRight, Zap, Shield, PenSquare } from 'lucide-react';
import { PostGrid } from '@/components/blog/PostGrid';
import { useAuthStore } from '@/store/authStore';

export default function HomePage() {
  const { isAuthenticated, user } = useAuthStore();

  // If logged in and is an author/admin, go to write; otherwise go to dashboard or register
  const writeHref = isAuthenticated
    ? ['author', 'admin', 'master_admin'].includes(user?.role || '')
      ? '/dashboard/posts/new'
      : '/dashboard'
    : '/auth/register';

  const writeLabel = isAuthenticated
    ? ['author', 'admin', 'master_admin'].includes(user?.role || '')
      ? 'Start writing'
      : 'Go to dashboard'
    : 'Start writing';

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background pt-20 pb-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6">
            <Zap className="w-4 h-4" />
            Modern Blog Platform
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">
            Ideas worth
            <br />
            <span className="text-primary">sharing</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
            A beautiful space for writers and readers. Discover stories, share ideas, and connect with a community that cares about great writing.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity"
            >
              Start reading
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href={writeHref}
              className="inline-flex items-center gap-2 px-6 py-3 border border-border rounded-xl font-medium hover:bg-muted transition-colors"
            >
              <PenSquare className="w-4 h-4" />
              {writeLabel}
            </Link>
          </div>
        </div>

        {/* Decorative blobs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl -translate-y-1/2 pointer-events-none" />
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {[
            {
              icon: PenSquare,
              title: 'Rich Writing Experience',
              desc: 'Powerful editor with AI assistance to help you write better, faster.',
            },
            {
              icon: Shield,
              title: 'Role-Based Access',
              desc: 'Readers, Authors, Admins — everyone has the right tools for their role.',
            },
            {
              icon: Zap,
              title: 'AI-Powered',
              desc: 'Generate content, improve writing, and get heading suggestions with AI.',
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="p-6 bg-card border border-border rounded-2xl hover:shadow-md transition-shadow">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* Latest Posts */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold">Latest Posts</h2>
            <Link
              href="/blog"
              className="flex items-center gap-1 text-sm text-primary hover:opacity-80 transition-opacity font-medium"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <PostGrid limit={6} />
        </div>
      </section>
    </div>
  );
}

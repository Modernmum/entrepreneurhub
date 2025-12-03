# Growth Manager Pro - Unbound.team Integration Guide
## Complete SaaS Platform Implementation

**Last Updated:** November 29, 2025
**Version:** 1.0.0

---

## Overview

This guide explains how to build **Growth Manager Pro** as a standalone SaaS platform powered by Unbound.team AI tools.

### Business Model

- **Growth Manager Pro** = SaaS platform (standalone product)
- **Unbound.team AI Tools** = Core product (the main offering)
- **Access:** Available to ALL paying customers with plan-based limits

---

## Plan Structure & Pricing

| Plan | Monthly Price | Lead Gen | Content | Research | Pages | Email | Support |
|------|--------------|----------|---------|----------|-------|-------|---------|
| **Free** | $0 | 10/mo | 5/mo | 2/mo | 3/mo | 1/mo | Email only |
| **Starter** | $50 | 50/mo | 20/mo | 10/mo | 10/mo | 5/mo | Email + Chat |
| **Growth** | $150 | 200/mo | 50/mo | 25/mo | 25/mo | 10/mo | Priority support |
| **Premium*** | Included | ♾️ Unlimited | ♾️ Unlimited | ♾️ Unlimited | ♾️ Unlimited | ♾️ Unlimited | White-glove |

*Premium = Maggie Forbes Tier 2+ clients (get GMP access included)

### Free Trial

- **14-day free trial** on Starter and Growth plans
- Full access to all features during trial
- No credit card required to start
- Automatically downgrades to Free plan if not converted

---

## Tech Stack

### Frontend
- **Framework:** React 18 + Next.js 14
- **Styling:** Tailwind CSS
- **UI Components:** Shadcn/ui
- **Charts:** Recharts
- **Forms:** React Hook Form + Zod validation
- **State:** React Query (TanStack Query)
- **Auth:** NextAuth.js

### Backend
- **API:** Next.js API Routes (serverless)
- **Database:** Supabase (PostgreSQL)
- **File Storage:** Supabase Storage
- **Queue:** Unbound.team queue system
- **Email:** Resend or SendGrid
- **Payments:** Stripe

### Deployment
- **Frontend:** Vercel
- **Backend:** Vercel Serverless Functions
- **Database:** Supabase (hosted)
- **CDN:** Vercel Edge Network

---

## Project Structure

```
growth-manager-pro/
├── app/                          # Next.js 14 app directory
│   ├── (auth)/                   # Auth routes
│   │   ├── login/
│   │   ├── signup/
│   │   └── forgot-password/
│   ├── (dashboard)/              # Protected dashboard routes
│   │   ├── dashboard/            # Main dashboard
│   │   ├── leads/                # Lead generation tool
│   │   ├── content/              # Content creation tool
│   │   ├── research/             # Market research tool
│   │   ├── pages/                # Landing page builder
│   │   ├── email/                # Email marketing tool
│   │   ├── settings/             # Account settings
│   │   └── billing/              # Billing & subscription
│   ├── api/                      # API routes
│   │   ├── auth/                 # Authentication
│   │   ├── users/                # User management
│   │   ├── billing/              # Stripe webhooks
│   │   └── unbound/              # Unbound.team proxy
│   └── layout.tsx                # Root layout
├── components/                   # React components
│   ├── ui/                       # UI primitives
│   ├── dashboard/                # Dashboard components
│   ├── tools/                    # Tool-specific components
│   └── marketing/                # Marketing site components
├── lib/                          # Utilities
│   ├── auth.ts                   # Auth helpers
│   ├── supabase.ts               # Supabase client
│   ├── stripe.ts                 # Stripe client
│   └── unbound.ts                # Unbound API client
├── hooks/                        # Custom React hooks
├── public/                       # Static assets
└── middleware.ts                 # Next.js middleware
```

---

## 1. Marketing Website

### Homepage (/)

```tsx
// app/page.tsx

import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="hero bg-gradient-to-br from-blue-600 to-purple-700 text-white">
        <div className="container mx-auto px-6 py-24 text-center">
          <h1 className="text-5xl font-bold mb-6">
            Your AI-Powered Growth Team
          </h1>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Generate leads, create content, research markets, build landing pages,
            and automate email campaigns - all powered by AI.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/signup">Start Free Trial</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#pricing">View Pricing</Link>
            </Button>
          </div>
          <p className="text-sm mt-4 opacity-80">
            14-day free trial • No credit card required
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="features py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything You Need to Grow
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon="🎯"
              title="Lead Generation"
              description="Find qualified prospects automatically from Reddit, forums, blogs, and social media."
              features={[
                'AI-powered lead discovery',
                'Fit score (1-10) for each lead',
                'Pain point identification',
                'Outreach strategy suggestions'
              ]}
            />

            <FeatureCard
              icon="✍️"
              title="Content Creation"
              description="Generate high-quality blog posts, social media content, and marketing copy."
              features={[
                'SEO-optimized blog posts',
                'Social media posts (all platforms)',
                'Email copy',
                'Product descriptions'
              ]}
            />

            <FeatureCard
              icon="📊"
              title="Market Research"
              description="Analyze competitors, identify market gaps, and validate business ideas."
              features={[
                'Competitor analysis',
                'Market size estimation',
                'Pricing recommendations',
                'Opportunity scoring'
              ]}
            />

            <FeatureCard
              icon="🚀"
              title="Landing Page Builder"
              description="Create high-converting landing pages in minutes with AI-generated copy and design."
              features={[
                'AI-generated copy',
                'Responsive HTML/CSS',
                'Preview & publish',
                'Conversion tracking'
              ]}
            />

            <FeatureCard
              icon="📧"
              title="Email Marketing"
              description="Build automated email campaigns with AI-generated sequences and subject lines."
              features={[
                'Welcome sequences',
                'Nurture campaigns',
                'Sales automation',
                'A/B test subject lines'
              ]}
            />

            <FeatureCard
              icon="📈"
              title="Analytics & Insights"
              description="Track your growth metrics and get actionable insights to improve results."
              features={[
                'Usage analytics',
                'Performance metrics',
                'ROI tracking',
                'Export reports'
              ]}
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="pricing py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">
            Simple, Transparent Pricing
          </h2>

          <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <PricingCard
              name="Free"
              price="$0"
              period="forever"
              description="Perfect for trying out the platform"
              features={[
                '10 leads per month',
                '5 content pieces',
                '2 research reports',
                '3 landing pages',
                '1 email campaign',
                'Email support'
              ]}
              cta="Get Started"
              ctaHref="/signup?plan=free"
            />

            <PricingCard
              name="Starter"
              price="$50"
              period="per month"
              description="Great for solopreneurs and freelancers"
              features={[
                '50 leads per month',
                '20 content pieces',
                '10 research reports',
                '10 landing pages',
                '5 email campaigns',
                'Email + Chat support',
                '14-day free trial'
              ]}
              cta="Start Free Trial"
              ctaHref="/signup?plan=starter"
              popular={false}
            />

            <PricingCard
              name="Growth"
              price="$150"
              period="per month"
              description="For growing businesses and teams"
              features={[
                '200 leads per month',
                '50 content pieces',
                '25 research reports',
                '25 landing pages',
                '10 email campaigns',
                'Priority support',
                'API access',
                '14-day free trial'
              ]}
              cta="Start Free Trial"
              ctaHref="/signup?plan=growth"
              popular={true}
            />

            <PricingCard
              name="Premium"
              price="Included"
              period="with consulting"
              description="For Maggie Forbes clients"
              features={[
                '♾️ Unlimited leads',
                '♾️ Unlimited content',
                '♾️ Unlimited research',
                '♾️ Unlimited pages',
                '♾️ Unlimited campaigns',
                'White-glove support',
                'Done-for-you option'
              ]}
              cta="Contact Kristi"
              ctaHref="https://maggieforbes.com/contact"
              featured={true}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta py-20 bg-blue-600 text-white text-center">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Accelerate Your Growth?
          </h2>
          <p className="text-xl mb-8">
            Join thousands of entrepreneurs using AI to grow their businesses.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/signup">Start Your Free Trial</Link>
          </Button>
          <p className="text-sm mt-4 opacity-80">
            No credit card required • Cancel anytime
          </p>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description, features }) {
  return (
    <div className="feature-card bg-white p-6 rounded-lg shadow-md">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{description}</p>
      <ul className="space-y-2">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="text-green-500">✓</span>
            <span className="text-sm">{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PricingCard({ name, price, period, description, features, cta, ctaHref, popular, featured }) {
  return (
    <div className={`pricing-card bg-white p-6 rounded-lg shadow-lg ${popular ? 'ring-2 ring-blue-600' : ''} ${featured ? 'bg-gradient-to-br from-purple-50 to-blue-50' : ''}`}>
      {popular && (
        <div className="text-blue-600 font-semibold text-sm mb-2">
          MOST POPULAR
        </div>
      )}
      {featured && (
        <div className="text-purple-600 font-semibold text-sm mb-2">
          FOR CLIENTS
        </div>
      )}
      <h3 className="text-2xl font-bold mb-2">{name}</h3>
      <div className="mb-4">
        <span className="text-4xl font-bold">{price}</span>
        <span className="text-gray-600 text-sm">/{period}</span>
      </div>
      <p className="text-gray-600 text-sm mb-6">{description}</p>
      <ul className="space-y-3 mb-6">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <span className="text-green-500">✓</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <Button className="w-full" variant={popular ? 'default' : 'outline'} asChild>
        <Link href={ctaHref}>{cta}</Link>
      </Button>
    </div>
  );
}
```

---

## 2. Sign Up Flow

### Sign Up Page

```tsx
// app/(auth)/signup/page.tsx

'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SignUpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get('plan') || 'free';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      // Step 1: Create user account
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          plan: plan
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create account');
      }

      const { userId } = await response.json();

      // Step 2: Redirect to onboarding
      router.push('/onboarding');

    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Create Your Account</h1>
          <p className="text-gray-600">
            Start your {plan === 'free' ? 'free account' : '14-day free trial'}
          </p>
        </div>

        {plan !== 'free' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Selected Plan:</strong> {plan.charAt(0).toUpperCase() + plan.slice(1)}
              <br />
              <span className="text-xs">14-day free trial • No credit card required</span>
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="John Doe"
            />
          </div>

          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
            />
            <p className="text-xs text-gray-500 mt-1">
              Must be at least 8 characters
            </p>
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              required
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          Already have an account?{' '}
          <a href="/login" className="text-blue-600 hover:underline">
            Log in
          </a>
        </p>

        <p className="text-xs text-gray-500 text-center mt-4">
          By signing up, you agree to our{' '}
          <a href="/terms" className="underline">Terms</a> and{' '}
          <a href="/privacy" className="underline">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}
```

### Sign Up API Endpoint

```typescript
// app/api/auth/signup/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const UNBOUND_API_KEY = process.env.UNBOUND_API_KEY!;
const UNBOUND_BASE_URL = process.env.UNBOUND_BASE_URL || 'https://api.unbound.team';
const TENANT_SLUG = 'kristi-empire';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, plan } = await request.json();

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user in Supabase
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        name,
        email,
        password: hashedPassword,
        plan: plan || 'free',
        status: 'active',
        trial_ends_at: plan !== 'free' ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) : null
      })
      .select()
      .single();

    if (userError) {
      throw userError;
    }

    // Provision in Unbound.team
    const unboundResponse = await fetch(
      `${UNBOUND_BASE_URL}/api/partner/${TENANT_SLUG}/provision-client`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${UNBOUND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userEmail: email,
          userName: name,
          plan: plan || 'free',
          source: 'growth-manager-pro',
          brand: 'growth-manager-pro'
        })
      }
    );

    if (!unboundResponse.ok) {
      console.error('Failed to provision in Unbound.team');
    } else {
      const { userId: unboundUserId } = await unboundResponse.json();

      // Update user with Unbound ID
      await supabase
        .from('users')
        .update({ unbound_user_id: unboundUserId })
        .eq('id', user.id);
    }

    // Send welcome email
    await sendWelcomeEmail(email, name, plan);

    return NextResponse.json({
      success: true,
      userId: user.id,
      message: 'Account created successfully'
    });

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}

async function sendWelcomeEmail(email: string, name: string, plan: string) {
  // Implement email sending (Resend, SendGrid, etc.)
  console.log(`Sending welcome email to ${email}`);
}
```

---

## 3. Onboarding Flow (3 Steps)

### Step 1: Business Information

```tsx
// app/(dashboard)/onboarding/page.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    businessName: '',
    industry: '',
    mainGoal: '',
    targetAudience: '',
    location: 'Global'
  });
  const [generatingLeads, setGeneratingLeads] = useState(false);
  const [leads, setLeads] = useState([]);

  async function handleStep1Submit(e: React.FormEvent) {
    e.preventDefault();

    // Save business info
    await fetch('/api/users/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        business_name: formData.businessName,
        industry: formData.industry,
        main_goal: formData.mainGoal
      })
    });

    setStep(2);
  }

  async function handleStep2Submit(e: React.FormEvent) {
    e.preventDefault();
    setGeneratingLeads(true);

    try {
      // Generate first leads
      const response = await fetch('/api/unbound/lead-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetIndustry: formData.targetAudience,
          location: formData.location,
          count: 5,
          minScore: 7
        })
      });

      const { jobId } = await response.json();

      // Poll for results
      const leads = await pollForLeads(jobId);
      setLeads(leads);
      setGeneratingLeads(false);
      setStep(3);

    } catch (error) {
      console.error('Error generating leads:', error);
      setGeneratingLeads(false);
    }
  }

  async function pollForLeads(jobId: string): Promise<any[]> {
    while (true) {
      const response = await fetch(`/api/unbound/jobs/${jobId}`);
      const job = await response.json();

      if (job.state === 'completed') {
        return job.result.leads || [];
      }

      if (job.state === 'failed') {
        throw new Error(job.error);
      }

      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  function handleComplete() {
    router.push('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-6">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Step {step} of 3</span>
            <span className="text-sm text-gray-500">{Math.round((step / 3) * 100)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Step 1: Business Info */}
        {step === 1 && (
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <h1 className="text-3xl font-bold mb-2">Welcome to Growth Manager Pro! 🎉</h1>
            <p className="text-gray-600 mb-8">
              Let's set up your account in 3 quick steps.
            </p>

            <form onSubmit={handleStep1Submit} className="space-y-6">
              <div>
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  id="businessName"
                  required
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  placeholder="Acme Inc"
                />
              </div>

              <div>
                <Label htmlFor="industry">Industry</Label>
                <select
                  id="industry"
                  required
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="">Select your industry</option>
                  <option value="saas">SaaS</option>
                  <option value="ecommerce">E-commerce</option>
                  <option value="agency">Agency</option>
                  <option value="consulting">Consulting</option>
                  <option value="coaching">Coaching</option>
                  <option value="freelance">Freelance</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <Label htmlFor="mainGoal">What's your main goal?</Label>
                <Input
                  id="mainGoal"
                  required
                  value={formData.mainGoal}
                  onChange={(e) => setFormData({ ...formData, mainGoal: e.target.value })}
                  placeholder="e.g., Generate more leads, create content, research market"
                />
              </div>

              <Button type="submit" className="w-full">
                Continue →
              </Button>
            </form>
          </div>
        )}

        {/* Step 2: Generate First Leads */}
        {step === 2 && (
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <h2 className="text-3xl font-bold mb-2">Let's generate your first leads! 🎯</h2>
            <p className="text-gray-600 mb-8">
              We'll find 5 qualified prospects to get you started.
            </p>

            <form onSubmit={handleStep2Submit} className="space-y-6">
              <div>
                <Label htmlFor="targetAudience">Who are you looking for?</Label>
                <Input
                  id="targetAudience"
                  required
                  value={formData.targetAudience}
                  onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                  placeholder="e.g., SaaS founders looking for growth tools"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Be specific - the more detail, the better the results
                </p>
              </div>

              <div>
                <Label htmlFor="location">Where are they located?</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., USA, Europe, Global"
                />
              </div>

              <Button type="submit" className="w-full" disabled={generatingLeads}>
                {generatingLeads ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Generating leads... (this may take 30-60 seconds)
                  </>
                ) : (
                  'Generate My First 5 Leads'
                )}
              </Button>
            </form>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <h2 className="text-3xl font-bold mb-2">
              ✅ Success! We found {leads.length} leads for you!
            </h2>
            <p className="text-gray-600 mb-8">
              Here's a preview of what we found. Your full lead list is waiting in your dashboard.
            </p>

            <div className="space-y-4 mb-8">
              {leads.slice(0, 3).map((lead, i) => (
                <div key={i} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold">{lead.name}</h3>
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                      Fit: {lead.fitScore}/10
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{lead.company}</p>
                  <p className="text-sm">{lead.description}</p>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <h3 className="font-semibold mb-4">What's next?</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span>✓</span>
                  <span>Your leads are ready to download in your dashboard</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>→</span>
                  <span>Explore other tools (Content, Research, Pages, Email)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>→</span>
                  <span>Set up automated lead generation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>→</span>
                  <span>Invite your team members</span>
                </li>
              </ul>
            </div>

            <Button onClick={handleComplete} className="w-full">
              Go to Dashboard 🚀
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## 4. Main Dashboard

```tsx
// app/(dashboard)/dashboard/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

export default function DashboardPage() {
  const { data: session } = useSession();
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsage();
  }, []);

  async function fetchUsage() {
    try {
      const response = await fetch('/api/users/usage');
      const data = await response.json();
      setUsage(data);
    } catch (error) {
      console.error('Error fetching usage:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const isUnlimited = usage?.plan === 'premium';
  const isNearLimit = !isUnlimited && (
    usage?.leadsUsed / usage?.leadsLimit > 0.8 ||
    usage?.contentUsed / usage?.contentLimit > 0.8
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {session?.user?.name}!
          </h1>
          <div className="flex items-center gap-3">
            <span className="text-gray-600">
              {usage?.businessName || 'Your business'}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              isUnlimited
                ? 'bg-purple-100 text-purple-800'
                : 'bg-blue-100 text-blue-800'
            }`}>
              {isUnlimited ? 'Maggie Forbes Premium' : `${usage?.plan} Plan`}
            </span>
          </div>
        </div>

        {/* Usage Stats (if not unlimited) */}
        {!isUnlimited && (
          <Card className="p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">This Month's Usage</h2>
              <Link href="/billing" className="text-blue-600 text-sm hover:underline">
                Upgrade Plan
              </Link>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <UsageStat
                label="Leads Generated"
                used={usage?.leadsUsed || 0}
                limit={usage?.leadsLimit || 0}
                color="blue"
              />
              <UsageStat
                label="Content Pieces"
                used={usage?.contentUsed || 0}
                limit={usage?.contentLimit || 0}
                color="green"
              />
              <UsageStat
                label="Research Reports"
                used={usage?.researchUsed || 0}
                limit={usage?.researchLimit || 0}
                color="purple"
              />
              <UsageStat
                label="Landing Pages"
                used={usage?.pagesUsed || 0}
                limit={usage?.pagesLimit || 0}
                color="orange"
              />
            </div>

            {isNearLimit && (
              <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>⚠️ You're running out of usage!</strong>
                  <br />
                  Upgrade your plan to continue using all features.
                </p>
                <Button size="sm" className="mt-3" asChild>
                  <Link href="/billing">Upgrade Now</Link>
                </Button>
              </div>
            )}
          </Card>
        )}

        {/* Unlimited Badge */}
        {isUnlimited && (
          <Card className="p-6 mb-8 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">♾️</span>
              <h2 className="text-xl font-semibold">Unlimited Access</h2>
            </div>
            <p className="text-gray-700">
              As a Maggie Forbes Premium client, you have unlimited access to all AI tools.
              Use as much as you need - there are no limits!
            </p>
          </Card>
        )}

        {/* Tools Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-6">Your AI Tools</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <ToolCard
              icon="🎯"
              title="Lead Generation"
              description="Find qualified prospects"
              stats={`${usage?.leadsUsed || 0} generated this month`}
              href="/leads"
              color="blue"
            />
            <ToolCard
              icon="✍️"
              title="Content Creation"
              description="Blog posts, social media"
              stats={`${usage?.contentUsed || 0} pieces created`}
              href="/content"
              color="green"
            />
            <ToolCard
              icon="📊"
              title="Market Research"
              description="Competitor analysis"
              stats={`${usage?.researchUsed || 0} reports generated`}
              href="/research"
              color="purple"
            />
            <ToolCard
              icon="🚀"
              title="Landing Pages"
              description="High-converting pages"
              stats={`${usage?.pagesUsed || 0} pages built`}
              href="/pages"
              color="orange"
            />
            <ToolCard
              icon="📧"
              title="Email Marketing"
              description="Automated campaigns"
              stats={`${usage?.campaignsUsed || 0} campaigns sent`}
              href="/email"
              color="red"
            />
            <ToolCard
              icon="📈"
              title="Analytics"
              description="Track your growth"
              stats="View detailed reports"
              href="/analytics"
              color="gray"
            />
          </div>
        </div>

        {/* Recent Activity */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <RecentActivity userId={session?.user?.id} />
        </Card>
      </div>
    </div>
  );
}

function UsageStat({ label, used, limit, color }) {
  const percentage = (used / limit) * 100;

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm text-gray-600">
          {used} / {limit}
        </span>
      </div>
      <Progress value={percentage} className={`bg-${color}-200`} />
    </div>
  );
}

function ToolCard({ icon, title, description, stats, href, color }) {
  return (
    <Link href={href}>
      <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
        <div className="text-4xl mb-3">{icon}</div>
        <h3 className="text-lg font-semibold mb-1">{title}</h3>
        <p className="text-sm text-gray-600 mb-3">{description}</p>
        <p className="text-xs text-gray-500">{stats}</p>
      </Card>
    </Link>
  );
}

function RecentActivity({ userId }) {
  // Implement activity feed
  return (
    <div className="text-sm text-gray-600">
      <p>No recent activity yet. Start using the tools to see your activity here!</p>
    </div>
  );
}
```

---

## 5. Lead Generation Tool

```tsx
// app/(dashboard)/leads/page.tsx

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

export default function LeadGenerationPage() {
  const [formData, setFormData] = useState({
    targetIndustry: '',
    location: 'Global',
    count: 50,
    minScore: 7
  });
  const [generating, setGenerating] = useState(false);
  const [job, setJob] = useState(null);
  const [leads, setLeads] = useState([]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGenerating(true);
    setJob(null);
    setLeads([]);

    try {
      // Submit job
      const response = await fetch('/api/unbound/lead-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const { jobId } = await response.json();

      // Poll for results
      await pollJobStatus(jobId);

    } catch (error) {
      console.error('Error:', error);
      alert('Failed to generate leads. Please try again.');
      setGenerating(false);
    }
  }

  async function pollJobStatus(jobId: string) {
    const pollInterval = setInterval(async () => {
      const response = await fetch(`/api/unbound/jobs/${jobId}`);
      const jobData = await response.json();

      if (jobData.state === 'completed') {
        clearInterval(pollInterval);
        setJob(jobData);
        setLeads(jobData.result.leads || []);
        setGenerating(false);
      }

      if (jobData.state === 'failed') {
        clearInterval(pollInterval);
        alert('Job failed: ' + jobData.error);
        setGenerating(false);
      }
    }, 3000);
  }

  function downloadCSV() {
    if (!job?.result?.csv) return;

    const blob = new Blob([job.result.csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-${Date.now()}.csv`;
    a.click();
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">🎯 Lead Generation</h1>
        <p className="text-gray-600">
          Find qualified prospects automatically from across the web
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Input Form */}
        <div className="lg:col-span-1">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Generate Leads</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="targetIndustry">Who are you looking for?</Label>
                <Input
                  id="targetIndustry"
                  required
                  value={formData.targetIndustry}
                  onChange={(e) => setFormData({ ...formData, targetIndustry: e.target.value })}
                  placeholder="e.g., SaaS founders looking for marketing tools"
                />
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., USA, Europe, Global"
                />
              </div>

              <div>
                <Label htmlFor="count">How many leads?</Label>
                <Input
                  id="count"
                  type="number"
                  min="1"
                  max="1000"
                  value={formData.count}
                  onChange={(e) => setFormData({ ...formData, count: parseInt(e.target.value) })}
                />
              </div>

              <div>
                <Label htmlFor="minScore">Minimum fit score</Label>
                <select
                  id="minScore"
                  value={formData.minScore}
                  onChange={(e) => setFormData({ ...formData, minScore: parseInt(e.target.value) })}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="6">6 - Good fit</option>
                  <option value="7">7 - Strong fit</option>
                  <option value="8">8 - Excellent fit</option>
                  <option value="9">9 - Perfect fit</option>
                </select>
              </div>

              <Button type="submit" className="w-full" disabled={generating}>
                {generating ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Generating...
                  </>
                ) : (
                  'Generate Leads'
                )}
              </Button>
            </form>
          </Card>
        </div>

        {/* Results */}
        <div className="lg:col-span-2">
          {generating && (
            <Card className="p-8 text-center">
              <div className="animate-spin text-6xl mb-4">⏳</div>
              <h3 className="text-xl font-semibold mb-2">Generating leads...</h3>
              <p className="text-gray-600">
                This may take 1-2 minutes. We're searching across Reddit, forums,
                blogs, and social media for the best matches.
              </p>
            </Card>
          )}

          {job && leads.length > 0 && (
            <div>
              <Card className="p-6 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold">✅ Found {leads.length} Leads!</h3>
                    <p className="text-gray-600">
                      Average fit score: {job.result.summary?.avgFitScore || 0}/10
                    </p>
                  </div>
                  <Button onClick={downloadCSV}>
                    Download CSV
                  </Button>
                </div>
              </Card>

              <div className="space-y-4">
                {leads.map((lead, i) => (
                  <Card key={i} className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-lg font-semibold">{lead.name}</h4>
                        <p className="text-sm text-gray-600">{lead.company}</p>
                      </div>
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                        Fit: {lead.fitScore}/10
                      </span>
                    </div>

                    {lead.email && (
                      <p className="text-sm mb-2">
                        <strong>Email:</strong> {lead.email}
                      </p>
                    )}

                    <p className="text-sm mb-3">{lead.description}</p>

                    {lead.painPoints && lead.painPoints.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm font-medium mb-1">Pain Points:</p>
                        <ul className="list-disc list-inside text-sm text-gray-600">
                          {lead.painPoints.map((pain, j) => (
                            <li key={j}>{pain}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {lead.outreachStrategy && (
                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="text-sm font-medium mb-1">Outreach Strategy:</p>
                        <p className="text-sm text-gray-700">{lead.outreachStrategy}</p>
                      </div>
                    )}

                    <p className="text-xs text-gray-500 mt-3">
                      Source: {lead.source}
                    </p>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {!generating && !job && (
            <Card className="p-12 text-center">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold mb-2">Ready to Find Leads?</h3>
              <p className="text-gray-600">
                Fill out the form on the left to start generating qualified prospects
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

## 6. Unbound API Proxy Endpoint

```typescript
// app/api/unbound/lead-generation/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const UNBOUND_API_KEY = process.env.UNBOUND_API_KEY!;
const UNBOUND_BASE_URL = process.env.UNBOUND_BASE_URL || 'https://api.unbound.team';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('email', session.user.email)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check usage limits (if not premium)
    if (user.plan !== 'premium') {
      const { data: usage } = await supabase
        .from('usage')
        .select('leads_used, leads_limit')
        .eq('user_id', user.id)
        .eq('month', new Date().toISOString().slice(0, 7))
        .single();

      if (usage && usage.leads_used >= usage.leads_limit) {
        return NextResponse.json(
          { error: 'Monthly lead limit reached. Upgrade your plan to continue.' },
          { status: 403 }
        );
      }
    }

    const body = await request.json();

    // Call Unbound API
    const response = await fetch(
      `${UNBOUND_BASE_URL}/api/solutions/lead-generation`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${UNBOUND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user.unbound_user_id,
          targetIndustry: body.targetIndustry,
          location: body.location,
          criteria: {
            count: body.count || 50,
            minScore: body.minScore || 7
          }
        })
      }
    );

    const data = await response.json();

    // Increment usage counter
    if (user.plan !== 'premium') {
      await supabase.rpc('increment_leads_usage', {
        p_user_id: user.id,
        p_month: new Date().toISOString().slice(0, 7)
      });
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Lead generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate leads' },
      { status: 500 }
    );
  }
}
```

---

## Environment Variables

```bash
# .env.local

# Next.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
SUPABASE_SERVICE_KEY=eyJxxx

# Unbound.team API
UNBOUND_API_KEY=your_unbound_api_key
UNBOUND_BASE_URL=https://api.unbound.team
UNBOUND_TENANT_SLUG=kristi-empire

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Email (Resend)
RESEND_API_KEY=re_xxx
```

---

## Deployment Checklist

### Pre-Deployment
- [ ] Set up Supabase project
- [ ] Run database migrations
- [ ] Configure environment variables
- [ ] Set up Stripe products and prices
- [ ] Configure email service (Resend/SendGrid)
- [ ] Test all features locally

### Vercel Deployment
- [ ] Connect GitHub repository to Vercel
- [ ] Add environment variables in Vercel dashboard
- [ ] Configure custom domain
- [ ] Enable Vercel Analytics
- [ ] Set up error monitoring (Sentry)

### Post-Deployment
- [ ] Test sign-up flow
- [ ] Test all 5 AI tools
- [ ] Test billing/subscription
- [ ] Test upgrade/downgrade
- [ ] Verify email notifications
- [ ] Test usage limits
- [ ] Monitor error logs

---

## Key Features Summary

✅ **Complete SaaS Platform**
- Marketing website with pricing
- User authentication (NextAuth.js)
- 3-step onboarding flow
- Full dashboard with 5 AI tools
- Usage tracking and limits
- Billing with Stripe

✅ **Plan-Based Access**
- Free: Limited usage
- Starter ($50): Standard limits
- Growth ($150): Higher limits
- Premium (Maggie Forbes): Unlimited

✅ **Seamless Unbound Integration**
- All tools powered by Unbound.team API
- Automatic client provisioning
- Usage tracking per plan
- No limits for Premium users

✅ **Production Ready**
- Built with Next.js 14 + React 18
- Deployed on Vercel
- Scalable architecture
- Modern UI with Tailwind CSS

---

**Ready to launch Growth Manager Pro! 🚀**

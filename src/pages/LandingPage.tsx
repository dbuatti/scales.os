import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Target, TrendingUp, BookOpen, Users, Award, Home } from 'lucide-react'; // Added Home icon for consistency
import { cn } from '@/lib/utils';

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
  <Card className="bg-card/70 border-2 border-primary/50 shadow-lg hover:shadow-primary/30 transition-all duration-300">
    <CardHeader className="flex flex-row items-center space-x-4 p-4">
      <div className="p-2 rounded-full bg-primary/20 text-primary border border-primary/30">
        {icon}
      </div>
      <CardTitle className="text-lg font-semibold text-primary font-mono text-glow">{title}</CardTitle>
    </CardHeader>
    <CardContent className="p-4 pt-0">
      <p className="text-sm text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
);

const LandingPage: React.FC = () => {
  console.log("[LandingPage.tsx] LandingPage component rendering."); // Added log
  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-start bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative w-full py-20 md:py-32 text-center bg-gradient-to-br from-background to-card/50 border-b-4 border-primary/50 shadow-inner">
        <div className="container mx-auto px-4 max-w-4xl">
          <Badge variant="secondary" className="mb-4 text-primary border-primary/50 bg-primary/10 text-glow">
            Unlock Your Musical Potential
          </Badge>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-primary mb-6 font-mono leading-tight text-glow-intense">
            Master Your Scales, Arpeggios & Exercises
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            The ultimate practice companion for pianists, designed to build flawless technique and accelerate your progress with a structured, graded system.
          </p>
          <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8 py-3 shadow-lg hover:shadow-primary/50 transition-all duration-300 border-2 border-primary/70">
            <Link to="/login">Start Your Mastery Journey</Link>
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-16 md:py-24 bg-card/20">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-primary mb-12 font-mono text-glow">
            Why SCALES.OS?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<CheckCircle className="w-6 h-6" />}
              title="Personalized Practice"
              description="Tailor your practice sessions with granular control over articulations, rhythms, hand configurations, and more."
            />
            <FeatureCard
              icon={<TrendingUp className="w-6 h-6" />}
              title="Structured Progress"
              description="Follow a clear, graded curriculum from beginner to professional, ensuring consistent and measurable improvement."
            />
            <FeatureCard
              icon={<Target className="w-6 h-6" />}
              title="Intelligent Suggestions"
              description="Get AI-powered recommendations for your next practice focus, helping you overcome plateaus and optimize your learning."
            />
            <FeatureCard
              icon={<BookOpen className="w-6 h-6" />}
              title="Comprehensive Library"
              description="Access a vast library of scales, arpeggios, Dohnányi, and Hanon exercises, all at your fingertips."
            />
            <FeatureCard
              icon={<Award className="w-6 h-6" />}
              title="Track Your Mastery"
              description="Visualize your highest mastered BPM for every permutation and exercise, celebrating every milestone."
            />
            <FeatureCard
              icon={<Users className="w-6 h-6" />}
              title="For All Levels"
              description="Whether you're a student building fundamentals or a professional refining technique, SCALES.OS adapts to your needs."
            />
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="w-full py-16 md:py-24 text-center bg-gradient-to-tl from-background to-card/50 border-t-4 border-primary/50">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-6 font-mono text-glow">
            Ready to Transform Your Practice?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join SCALES.OS today and experience a smarter, more effective way to achieve your musical goals.
          </p>
          <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8 py-3 shadow-lg hover:shadow-primary/50 transition-all duration-300 border-2 border-primary/70">
            <Link to="/login">Sign Up Now</Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
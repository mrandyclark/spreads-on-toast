import { Calculator, Lock, Users } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const features = [
  {
    description: 'No editing once the season starts. Commit to your calls and live with them all year long.',
    icon: Lock,
    title: 'Locked picks',
  },
  {
    description: 'Closest to Vegas wins. No complex point spreads or weighted systems. Just correct picks.',
    icon: Calculator,
    title: 'Simple scoring',
  },
  {
    description: 'Built for bragging rights, not bankrolls. Trash talk encouraged, real money not involved.',
    icon: Users,
    title: 'Friends-first',
  },
];

export function Features() {
  return (
    <section className="bg-muted/30 py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-serif text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
            Why you{"'"}ll love it
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            Simple rules, friendly competition, season-long fun.
          </p>
        </div>

        {/* Feature cards */}
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card
              className="group border-border/50 bg-card transition-all hover:border-primary/20 hover:shadow-lg"
              key={feature.title}
            >
              <CardHeader className="pb-4">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/15">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl font-semibold">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="leading-relaxed text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

import { BarChart3, Zap, BrainCircuit } from 'lucide-react';

const features = [
  {
    icon: <BarChart3 className="w-8 h-8 text-accent-blue" />,
    title: 'Competitive Positioning',
    description: 'See exactly how any company stacks up against their key competitors in real-time market analysis.',
  },
  {
    icon: <BrainCircuit className="w-8 h-8 text-accent-green" />,
    title: 'Sentiment Intelligence',
    description: 'Track brand perception, narrative momentum, and market sentiment across multiple data sources.',
  },
  {
    icon: <Zap className="w-8 h-8 text-accent-amber" />,
    title: 'Instant Strategic Insights',
    description: 'Get VC-grade strategic analysis and actionable recommendations in seconds, not weeks.',
  },
];

export function FeatureCards() {
  return (
    <div className="container mx-auto px-4 mt-24">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        {features.map((feature) => (
          <div key={feature.title} className="text-center">
            <div className="flex justify-center mb-4">{feature.icon}</div>
            <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

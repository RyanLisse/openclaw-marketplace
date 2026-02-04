import Link from 'next/link';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
  imageSrc?: string;
  steps?: Array<{ number: number; label: string }>;
}

export default function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  imageSrc = '/empty-state.svg',
  steps,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
      {imageSrc && (
        <img 
          src={imageSrc} 
          alt="Empty state illustration" 
          className="w-64 h-64 mb-8 opacity-50"
        />
      )}
      
      <h2 className="text-2xl font-semibold text-gray-900 mb-2">{title}</h2>
      <p className="text-gray-600 mb-8 max-w-md">{description}</p>
      
      {steps && steps.length > 0 && (
        <div className="mb-8 flex gap-4 max-w-2xl">
          {steps.map((step) => (
            <div key={step.number} className="flex-1">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600 font-semibold mb-2 mx-auto">
                {step.number}
              </div>
              <p className="text-sm text-gray-700">{step.label}</p>
            </div>
          ))}
        </div>
      )}
      
      <div className="flex gap-4">
        <Link
          href={actionHref}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          {actionLabel}
        </Link>
        
        <Link
          href="/features"
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
        >
          Learn More
        </Link>
      </div>
    </div>
  );
}

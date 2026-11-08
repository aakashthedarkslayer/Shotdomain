import React from 'react';

export interface StepItem {
  num: number;
  label: string;
}

interface StepIndicatorProps {
  currentStep: number;
  steps: StepItem[];
}

export function StepIndicator({ currentStep, steps }: StepIndicatorProps) {
  return (
    <nav aria-label="Darkroom Progress" className="w-full">
      <ol className="flex items-center justify-between">
        {steps.map((step, idx) => {
          const isComplete = currentStep > step.num;
          const isCurrent = currentStep === step.num;

          return (
            <li key={step.num} className="relative flex flex-1 items-center last:flex-none">
              <div className="group flex flex-col items-center">
                {/* Circle / Icon */}
                <div
                  className={`flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl text-xs sm:text-sm font-mono font-bold transition-all duration-200 ${
                    isComplete
                      ? 'bg-[#121315] text-white shadow-xs dark:bg-stone-100 dark:text-[#121315]'
                      : isCurrent
                      ? 'border-2 border-[#E54D2E] bg-white text-[#E54D2E] ring-4 ring-orange-500/10 dark:bg-stone-900 dark:border-[#FF5733] dark:text-[#FF5733]'
                      : 'border border-stone-200 bg-stone-50 text-stone-400 dark:border-stone-800 dark:bg-stone-900/60 dark:text-stone-600'
                  }`}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {isComplete ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span>0{step.num}</span>
                  )}
                </div>

                {/* Text Label */}
                <div className="mt-2 text-center">
                  <span
                    className={`block text-[10px] sm:text-xs font-mono uppercase tracking-wider transition-colors ${
                      isCurrent
                        ? 'text-[#E54D2E] dark:text-[#FF5733] font-semibold'
                        : isComplete
                        ? 'text-stone-800 dark:text-stone-200 font-medium'
                        : 'text-stone-400 dark:text-stone-600'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              </div>

              {/* Connecting Bar */}
              {idx < steps.length - 1 && (
                <div className="mx-2 sm:mx-4 -mt-5 h-[2px] flex-1 transition-all duration-300">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      currentStep > step.num
                        ? 'bg-[#E54D2E]'
                        : 'bg-stone-200 dark:bg-stone-800'
                    }`}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default StepIndicator;

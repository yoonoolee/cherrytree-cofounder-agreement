import React from 'react';

function PricingCard({
  plan,
  onButtonClick,
  buttonText,
  currentPlan = null,
  showCurrentBadge = false
}) {
  const isCurrentPlan = showCurrentBadge && currentPlan && currentPlan.toLowerCase() === plan.name.toLowerCase();

  return (
    <div
      className={`bg-white p-8 rounded-lg flex flex-col relative ${
        plan.featured
          ? ''
          : 'border border-gray-400'
      }`}
      style={plan.featured ? { border: '3px solid #0056D6' } : {}}
    >
      {/* Current Plan Badge */}
      {isCurrentPlan && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-gray-900 text-white text-xs font-semibold px-4 py-1 rounded-full">
            Current plan
          </span>
        </div>
      )}

      <h3 className="text-xl font-normal mb-2 text-[#716B6B]">{plan.name}</h3>
      <div className="text-4xl font-bold mb-2">{plan.price}</div>
      <p className="text-gray-600 mb-6">{plan.description}</p>

      {/* Button */}
      {isCurrentPlan ? (
        <div className="w-full py-3 rounded-lg font-semibold mb-6 bg-gray-100 text-gray-500 text-center cursor-default">
          Current plan
        </div>
      ) : (
        <button
          onClick={onButtonClick}
          className={`w-full py-3 rounded-lg font-semibold transition mb-6 ${
            plan.featured
              ? 'button-shimmer bg-[#000000] text-white hover:bg-[#1a1a1a]'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {buttonText || 'Get started'}
        </button>
      )}

      {/* Features List */}
      <ul className="space-y-3 flex-grow">
        {plan.features.map((feature, idx) => (
          <li key={idx} className="flex items-start gap-2">
            <span className="text-[#716B6B] flex-shrink-0 mt-0.5">✓</span>
            <span className="text-gray-700 text-sm sm:text-base">{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default PricingCard;

import React from 'react';
import { Clock, CheckCircle } from 'lucide-react';

export const PricingPlans: React.FC = () => {
  return (
    <div className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Planos e Preços
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Em breve, você poderá escolher o melhor plano para suas necessidades.
          </p>
        </div>

        <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:mx-0 xl:grid-cols-3">
          {['Básico', 'Profissional', 'Empresarial'].map((plan) => (
            <div key={plan} className="border border-gray-200 rounded-lg shadow-sm divide-y divide-gray-200 bg-white">
              <div className="p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">{plan}</h3>
                <p className="mt-4 text-sm text-gray-500">
                  Em breve
                </p>
                <div className="mt-8">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="ml-3 text-sm text-gray-500">Recurso 1</span>
                  </div>
                  <div className="mt-4 flex items-center">
                    <Clock className="h-5 w-5 text-green-500" />
                    <span className="ml-3 text-sm text-gray-500">Recurso 2</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Clock, CheckCircle } from 'lucide-react';
import { CheckoutButton } from '../components/CheckoutButton';

export const PricingPlans: React.FC = () => {
  return (
    <div className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Planos e Preços
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Escolha o melhor plano para suas necessidades
          </p>
        </div>

        <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:mx-0 xl:grid-cols-2">
          {/* Plano Gratuito */}
          <div className="border border-gray-200 rounded-lg shadow-sm divide-y divide-gray-200 bg-white">
            <div className="p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Básico</h3>
              <p className="mt-4 text-sm text-gray-500">
                Perfeito para experimentar nossa plataforma
              </p>
              <p className="mt-8">
                <span className="text-4xl font-extrabold text-gray-900">R$0</span>
                <span className="text-base font-medium text-gray-500">/mês</span>
              </p>
              <button
                className="mt-8 block w-full bg-gray-800 border border-gray-800 rounded-md py-2 text-sm font-semibold text-white text-center hover:bg-gray-900"
                disabled
              >
                Plano Atual
              </button>
            </div>
            <div className="pt-6 pb-8 px-6">
              <h4 className="text-sm font-medium text-gray-900 tracking-wide">
                Inclui:
              </h4>
              <ul className="mt-4 space-y-3">
                <li className="flex space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-gray-500">15 dias de teste</span>
                </li>
                <li className="flex space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-gray-500">Registro de horas básico</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Plano Pro */}
          <div className="border border-gray-200 rounded-lg shadow-sm divide-y divide-gray-200 bg-white">
            <div className="p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Profissional</h3>
              <p className="mt-4 text-sm text-gray-500">
                Para profissionais que precisam de mais recursos
              </p>
              <p className="mt-8">
                <span className="text-4xl font-extrabold text-gray-900">R$29,90</span>
                <span className="text-base font-medium text-gray-500">/mês</span>
              </p>
              <div className="mt-8">
                <CheckoutButton />
              </div>
            </div>
            <div className="pt-6 pb-8 px-6">
              <h4 className="text-sm font-medium text-gray-900 tracking-wide">
                Inclui:
              </h4>
              <ul className="mt-4 space-y-3">
                <li className="flex space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-gray-500">Registro de horas ilimitado</span>
                </li>
                <li className="flex space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-gray-500">Relatórios avançados</span>
                </li>
                <li className="flex space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-gray-500">Exportação de dados</span>
                </li>
                <li className="flex space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-gray-500">Suporte prioritário</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

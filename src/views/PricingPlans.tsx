import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { stripeService } from '../services/stripeService';
import { Clock, CheckCircle, Loader2 } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  priceId: string;
  price: number;
  interval: string;
}

export const PricingPlans = () => {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const products = await stripeService.getProducts();
      setProducts(products);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (priceId: string) => {
    if (!user) {
      setError('Você precisa estar logado para assinar um plano');
      return;
    }

    try {
      setLoading(true);
      await stripeService.createCheckoutSession(priceId, user.id);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-lg mb-4">
          <Clock className="w-8 h-8 text-violet-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Escolha seu plano</h1>
        <p className="text-lg text-gray-600">Comece agora com 7 dias grátis</p>
      </div>

      {error && (
        <div className="max-w-3xl mx-auto mb-8 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Grid de Planos */}
      <div className="max-w-7xl mx-auto grid gap-8 lg:grid-cols-3">
        {products.map((product) => (
          <div
            key={product.id}
            className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
          >
            <div className="p-8">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">{product.name}</h3>
              <p className="text-gray-500 mb-6">{product.description}</p>
              
              <div className="flex items-baseline mb-8">
                <span className="text-4xl font-bold text-gray-900">R$ {product.price}</span>
                <span className="text-gray-500 ml-2">/{product.interval === 'month' ? 'mês' : 'ano'}</span>
              </div>

              <button
                onClick={() => handleSubscribe(product.priceId)}
                disabled={loading}
                className="w-full bg-violet-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                ) : (
                  'Começar agora'
                )}
              </button>
            </div>

            {/* Lista de benefícios */}
            <div className="px-8 pb-8">
              <h4 className="font-semibold text-gray-900 mb-4">O que está incluído:</h4>
              <ul className="space-y-3">
                <li className="flex items-center text-gray-600">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  Registro ilimitado de horas
                </li>
                <li className="flex items-center text-gray-600">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  Relatórios detalhados
                </li>
                <li className="flex items-center text-gray-600">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  Suporte prioritário
                </li>
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

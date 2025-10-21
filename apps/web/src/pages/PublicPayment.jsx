import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { invoicesApi } from '../lib/api';
import { CreditCard, Check } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

export default function PublicPayment() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadInvoice();
  }, [id]);

  const loadInvoice = async () => {
    try {
      const response = await invoicesApi.getPublic(id);
      setInvoice(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Invoice not found');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">{error || 'Invoice not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 text-white p-6">
            <h1 className="text-2xl font-bold">Invoice Payment</h1>
            <p className="text-blue-100 mt-2">{invoice.invoiceNumber}</p>
          </div>

          {/* Invoice details */}
          <div className="p-6 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {invoice.title}
              </h2>
              {invoice.description && (
                <p className="text-gray-600">{invoice.description}</p>
              )}
            </div>

            {/* Line items */}
            <div className="border-t border-b border-gray-200 py-4">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-600">
                    <th className="pb-2">Description</th>
                    <th className="pb-2 text-right">Quantity</th>
                    <th className="pb-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {invoice.items?.map((item) => (
                    <tr key={item.id} className="border-t border-gray-100">
                      <td className="py-2">{item.description}</td>
                      <td className="py-2 text-right">{item.quantity}</td>
                      <td className="py-2 text-right">
                        ${parseFloat(item.amount).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">
                  ${parseFloat(invoice.subtotal).toFixed(2)}
                </span>
              </div>
              {parseFloat(invoice.taxAmount) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    Tax ({parseFloat(invoice.taxRate)}%)
                  </span>
                  <span className="font-medium">
                    ${parseFloat(invoice.taxAmount).toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                <span>Amount Due</span>
                <span className="text-blue-600">
                  ${parseFloat(invoice.amountDue).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Payment status */}
            {invoice.status === 'PAID' ? (
              <div className="flex items-center justify-center p-4 bg-green-50 border border-green-200 rounded-lg">
                <Check className="w-5 h-5 text-green-600 mr-2" />
                <span className="text-green-700 font-medium">
                  This invoice has been paid
                </span>
              </div>
            ) : (
              <button className="w-full flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <CreditCard className="w-5 h-5 mr-2" />
                Pay Now
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
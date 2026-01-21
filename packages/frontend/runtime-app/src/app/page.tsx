'use client';

import { useState } from 'react';
import axios from 'axios';

const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:3003';

export default function RuntimeApp() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    tradeId: 'T-' + Date.now(),
    programId: '123',
    issuerId: 'ISSUER_001',
    currency: 'EUR',
    amount: 15000,
    country: 'DE',
    customerType: 'EXISTING',
    riskScore: 45
  });

  const executePeculiarities = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${GATEWAY_URL}/api/peculiarity/execute`, {
        tradeId: formData.tradeId,
        programId: formData.programId,
        issuerId: formData.issuerId,
        data: formData
      });
      setResult(response.data);
    } catch (error: any) {
      setResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🚀 Rule Flow Platform - Runtime App
          </h1>
          <p className="text-gray-600">Schema-driven UI with rule execution</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Trade Details</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trade ID
                </label>
                <input
                  type="text"
                  value={formData.tradeId}
                  onChange={(e) => setFormData({...formData, tradeId: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Program ID
                  </label>
                  <input
                    type="text"
                    value={formData.programId}
                    onChange={(e) => setFormData({...formData, programId: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Issuer ID
                  </label>
                  <input
                    type="text"
                    value={formData.issuerId}
                    onChange={(e) => setFormData({...formData, issuerId: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currency
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({...formData, currency: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount
                  </label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country
                  </label>
                <select
                  value={formData.country}
                  onChange={(e) => setFormData({...formData, country: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="DE">Germany (DE)</option>
                  <option value="FR">France (FR)</option>
                  <option value="US">United States (US)</option>
                </select>
              </div>

              <button
                onClick={executePeculiarities}
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50"
              >
                {loading ? 'Executing Rules...' : '▶️ Execute Peculiarity Processing'}
              </button>
            </div>
          </div>

          {/* Results */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Execution Results</h2>
            
            {!result ? (
              <div className="text-center text-gray-500 py-12">
                <div className="text-6xl mb-4">📋</div>
                <p>Execute rules to see results</p>
              </div>
            ) : result.success ? (
              <div className="space-y-4">
                <div className="bg-green-50 border-2 border-green-500 rounded-lg p-4">
                  <div className="text-green-800 font-semibold mb-2">✓ Success!</div>
                  <div className="text-sm text-green-700">
                    Rules executed in {result.metadata?.executionTimeMs}ms
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Applied Peculiarities:</h3>
                  <div className="space-y-2 text-sm">
                    {result.peculiarities?.paymentTerm && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Payment Term:</span>
                        <span className="font-semibold">{result.peculiarities.paymentTerm} days</span>
                      </div>
                    )}
                    {result.peculiarities?.requiresApproval && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Requires Approval:</span>
                        <span className="font-semibold text-orange-600">Yes</span>
                      </div>
                    )}
                    {result.peculiarities?.complianceReviewRequired && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Compliance Review:</span>
                        <span className="font-semibold text-red-600">Required</span>
                      </div>
                    )}
                  </div>
                </div>

                {result.metadata?.rulesMatched > 0 && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 mb-2">Rules Matched:</h3>
                    <div className="text-sm text-blue-800">
                      {result.metadata.rulesMatched} rule(s) applied
                    </div>
                  </div>
                )}

                <details className="bg-gray-50 rounded-lg p-4">
                  <summary className="cursor-pointer font-semibold text-gray-900">
                    View Full Response
                  </summary>
                  <pre className="mt-3 text-xs bg-gray-900 text-green-400 p-3 rounded overflow-x-auto">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </details>
              </div>
            ) : (
              <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4">
                <div className="text-red-800 font-semibold mb-2">✗ Error</div>
                <div className="text-sm text-red-700">{result.error}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

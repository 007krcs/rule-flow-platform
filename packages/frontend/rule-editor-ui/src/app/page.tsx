'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

const EDITOR_API_URL = process.env.NEXT_PUBLIC_EDITOR_API_URL || 'http://localhost:3004';

export default function RuleEditorUI() {
  const [rulesets, setRulesets] = useState<any[]>([]);
  const [selectedRuleset, setSelectedRuleset] = useState<any>(null);
  const [showCreateRule, setShowCreateRule] = useState(false);
  
  const [newRule, setNewRule] = useState({
    ruleId: '',
    name: '',
    description: '',
    when: {
      field: '',
      op: 'eq',
      value: ''
    },
    then: [{
      type: 'set',
      field: '',
      value: ''
    }],
    priority: 10
  });

  useEffect(() => {
    loadRulesets();
  }, []);

  const loadRulesets = async () => {
    try {
      const response = await axios.get(`${EDITOR_API_URL}/api/rulesets`);
      setRulesets(response.data.data || []);
    } catch (error) {
      console.error('Failed to load rulesets:', error);
    }
  };

  const loadRuleset = async (rulesetId: string) => {
    try {
      const response = await axios.get(`${EDITOR_API_URL}/api/rulesets/${rulesetId}`);
      setSelectedRuleset(response.data.data);
    } catch (error) {
      console.error('Failed to load ruleset:', error);
    }
  };

  const createRule = async () => {
    if (!selectedRuleset) return;
    
    try {
      await axios.post(
        `${EDITOR_API_URL}/api/rulesets/${selectedRuleset.ruleSetId}/rules`,
        newRule
      );
      
      alert('Rule created successfully!');
      loadRuleset(selectedRuleset.ruleSetId);
      setShowCreateRule(false);
      setNewRule({
        ruleId: '',
        name: '',
        description: '',
        when: { field: '', op: 'eq', value: '' },
        then: [{ type: 'set', field: '', value: '' }],
        priority: 10
      });
    } catch (error) {
      alert('Failed to create rule');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            📝 Rule Editor UI
          </h1>
          <p className="text-gray-600">Create and manage business rules</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Rulesets List */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Rulesets</h2>
            <div className="space-y-2">
              {rulesets.map((ruleset) => (
                <button
                  key={ruleset.ruleset_id}
                  onClick={() => loadRuleset(ruleset.ruleset_id)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                    selectedRuleset?.ruleSetId === ruleset.ruleset_id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  <div className="font-semibold">{ruleset.name}</div>
                  <div className="text-sm opacity-75">{ruleset.ruleset_id}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Rules List */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl p-6">
            {!selectedRuleset ? (
              <div className="text-center text-gray-500 py-12">
                <div className="text-6xl mb-4">📋</div>
                <p>Select a ruleset to view rules</p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Rules in {selectedRuleset.name}
                  </h2>
                  <button
                    onClick={() => setShowCreateRule(!showCreateRule)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                  >
                    + Create Rule
                  </button>
                </div>

                {showCreateRule && (
                  <div className="bg-gray-50 p-6 rounded-lg mb-6">
                    <h3 className="font-bold mb-4">Create New Rule</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Rule ID</label>
                        <input
                          type="text"
                          value={newRule.ruleId}
                          onChange={(e) => setNewRule({...newRule, ruleId: e.target.value})}
                          className="w-full px-3 py-2 border rounded-lg"
                          placeholder="PAYMENT_TERM_RULE"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Name</label>
                        <input
                          type="text"
                          value={newRule.name}
                          onChange={(e) => setNewRule({...newRule, name: e.target.value})}
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-sm font-medium mb-1">Field</label>
                          <input
                            type="text"
                            value={newRule.when.field}
                            onChange={(e) => setNewRule({
                              ...newRule,
                              when: {...newRule.when, field: e.target.value}
                            })}
                            className="w-full px-3 py-2 border rounded-lg"
                            placeholder="currency"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Operator</label>
                          <select
                            value={newRule.when.op}
                            onChange={(e) => setNewRule({
                              ...newRule,
                              when: {...newRule.when, op: e.target.value}
                            })}
                            className="w-full px-3 py-2 border rounded-lg"
                          >
                            <option value="eq">Equals</option>
                            <option value="gt">Greater Than</option>
                            <option value="lt">Less Than</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Value</label>
                          <input
                            type="text"
                            value={newRule.when.value}
                            onChange={(e) => setNewRule({
                              ...newRule,
                              when: {...newRule.when, value: e.target.value}
                            })}
                            className="w-full px-3 py-2 border rounded-lg"
                            placeholder="EUR"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={createRule}
                          className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
                        >
                          Save Rule
                        </button>
                        <button
                          onClick={() => setShowCreateRule(false)}
                          className="bg-gray-300 px-6 py-2 rounded-lg hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {selectedRuleset.rules?.map((rule: any) => (
                    <div key={rule.ruleId} className="border-2 border-gray-200 rounded-lg p-4 hover:border-indigo-400 transition-all">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-lg">{rule.name}</h4>
                          <p className="text-sm text-gray-600">{rule.description}</p>
                          <div className="mt-2 text-sm">
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              Priority: {rule.priority}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import friendService from '../../services/friendService';

const FriendSystemTest = () => {
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const addTestResult = (test, success, message) => {
    setTestResults(prev => [...prev, { test, success, message, timestamp: new Date() }]);
  };

  const runTests = async () => {
    setLoading(true);
    setTestResults([]);

    try {
      // Test 1: Get friends list
      try {
        const friendsResponse = await friendService.getFriends();
        addTestResult('Get Friends List', true, `Found ${friendsResponse.data.friends.length} friends`);
      } catch (error) {
        addTestResult('Get Friends List', false, error.message);
      }

      // Test 2: Get pending requests
      try {
        const requestsResponse = await friendService.getPendingRequests();
        addTestResult('Get Pending Requests', true, 
          `Received: ${requestsResponse.data.received.length}, Sent: ${requestsResponse.data.sent.length}`);
      } catch (error) {
        addTestResult('Get Pending Requests', false, error.message);
      }

      // Test 3: Search users
      try {
        const searchResponse = await friendService.searchUsers('test');
        addTestResult('Search Users', true, `Found ${searchResponse.data.users.length} users`);
      } catch (error) {
        addTestResult('Search Users', false, error.message);
      }

    } catch (error) {
      addTestResult('General Error', false, error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-6">Friend System Test</h1>
        
        <div className="mb-6">
          <button
            onClick={runTests}
            disabled={loading}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? 'Running Tests...' : 'Run Friend System Tests'}
          </button>
        </div>

        {testResults.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Test Results</h2>
            {testResults.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  result.success 
                    ? 'bg-green-50 border-green-200 text-green-800' 
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{result.test}</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    result.success ? 'bg-green-200' : 'bg-red-200'
                  }`}>
                    {result.success ? 'PASS' : 'FAIL'}
                  </span>
                </div>
                <p className="mt-2 text-sm">{result.message}</p>
                <p className="text-xs opacity-60 mt-1">
                  {result.timestamp.toLocaleTimeString()}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 p-4 bg-card border border-border rounded-lg">
          <h3 className="font-semibold mb-2">Manual Tests</h3>
          <ul className="text-sm space-y-1 text-foreground/80">
            <li>• Navigate to /friends to test the Friends page</li>
            <li>• Search for users and send friend requests</li>
            <li>• Check notifications for friend requests</li>
            <li>• Accept/reject friend requests</li>
            <li>• View public profiles at /profile/[handle]</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default FriendSystemTest;

import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Plus, 
  Download, 
  Eye, 
  Search,
  Copy,
  Check,
  Calendar,
  TrendingUp,
  DollarSign,
  Gift,
  AlertCircle,
  Loader
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import paymentService from '../../services/paymentService';

const PaymentCodeManager = () => {
  const [stats, setStats] = useState(null);
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);

  // Generate form state
  const [generateForm, setGenerateForm] = useState({
    amount: 10,
    quantity: 1,
    description: ''
  });

  useEffect(() => {
    fetchStats();
    fetchCodes();
  }, []);

  useEffect(() => {
    fetchCodes();
  }, [currentPage, statusFilter]);

  const fetchStats = async () => {
    try {
      const response = await paymentService.admin.getCodeStats();
      setStats(response.data);
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error('Access denied. You do not have permission to access payment code management.');
      } else {
        toast.error('Failed to load statistics');
      }
    }
  };

  const fetchCodes = async () => {
    try {
      setLoading(true);
      const response = await paymentService.admin.getPaymentCodes({
        page: currentPage,
        limit: 20,
        status: statusFilter
      });
      setCodes(response.data.codes);
      setTotalPages(response.data.pagination.totalPages);
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error('Access denied. You do not have permission to access payment code management.');
      } else {
        toast.error('Failed to load payment codes');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCodes = async (e) => {
    e.preventDefault();
    
    if (generateForm.amount < 1 || generateForm.amount > 10000) {
      toast.error('Amount must be between 1 and 10,000 credits');
      return;
    }
    
    if (generateForm.quantity < 1 || generateForm.quantity > 100) {
      toast.error('Quantity must be between 1 and 100 codes');
      return;
    }

    try {
      setGenerating(true);
      const response = await paymentService.admin.generateCodes(generateForm);
      
      toast.success(response.message);
      setShowGenerateModal(false);
      setGenerateForm({ amount: 10, quantity: 1, description: '' });
      
      // Refresh data
      await fetchStats();
      await fetchCodes();
      
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error('Access denied. You do not have permission to generate payment codes.');
      } else {
        toast.error(error.message || 'Failed to generate codes');
      }
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      toast.success('Code copied to clipboard');
      
      // Clear the copied indicator after 2 seconds
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      toast.error('Failed to copy code');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (code) => {
    if (code.isRedeemed) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
          <Check className="w-3 h-3 mr-1" />
          Redeemed
        </span>
      );
    }
    
    if (new Date(code.expiresAt) < new Date()) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
          <AlertCircle className="w-3 h-3 mr-1" />
          Expired
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
        <Gift className="w-3 h-3 mr-1" />
        Active
      </span>
    );
  };

  if (loading && !codes.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-card rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-card rounded-2xl"></div>
              ))}
            </div>
            <div className="h-96 bg-card rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent mb-2">
              Payment Code Manager
            </h1>
            <p className="text-muted-foreground">Generate and manage SkillWise payment codes</p>
          </div>
          <button
            onClick={() => setShowGenerateModal(true)}
            className="cosmic-button px-6 py-3 font-semibold flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Generate Codes
          </button>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-blue-600/10 rounded-2xl blur-lg opacity-50"></div>
              <div className="relative bg-card/80 backdrop-blur-sm rounded-2xl p-6 border border-blue-500/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Total Codes</p>
                    <p className="text-2xl font-bold text-foreground">{stats.overview.totalCodes}</p>
                  </div>
                  <CreditCard className="w-8 h-8 text-blue-500" />
                </div>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-green-600/10 rounded-2xl blur-lg opacity-50"></div>
              <div className="relative bg-card/80 backdrop-blur-sm rounded-2xl p-6 border border-green-500/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Active Codes</p>
                    <p className="text-2xl font-bold text-foreground">{stats.overview.activeCodes}</p>
                  </div>
                  <Gift className="w-8 h-8 text-green-500" />
                </div>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-purple-600/10 rounded-2xl blur-lg opacity-50"></div>
              <div className="relative bg-card/80 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Redeemed</p>
                    <p className="text-2xl font-bold text-foreground">{stats.overview.redeemedCodes}</p>
                  </div>
                  <Check className="w-8 h-8 text-purple-500" />
                </div>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 to-yellow-600/10 rounded-2xl blur-lg opacity-50"></div>
              <div className="relative bg-card/80 backdrop-blur-sm rounded-2xl p-6 border border-yellow-500/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Total Value</p>
                    <p className="text-2xl font-bold text-foreground">{stats.overview.totalValue}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-yellow-500" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Controls */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl blur-lg opacity-50"></div>
          <div className="relative bg-card/80 backdrop-blur-sm rounded-2xl p-6 border border-primary/20">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-wrap gap-2">
                {['all', 'active', 'redeemed'].map((status) => (
                  <button
                    key={status}
                    onClick={() => {
                      setStatusFilter(status);
                      setCurrentPage(1);
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                      statusFilter === status
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background/50 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
              
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
            </div>
          </div>
        </div>

        {/* Payment Codes Table */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl blur-lg opacity-50"></div>
          <div className="relative bg-card/80 backdrop-blur-sm rounded-2xl border border-primary/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-primary/5 border-b border-primary/20">
                  <tr>
                    <th className="text-left p-4 font-semibold text-foreground">Code</th>
                    <th className="text-left p-4 font-semibold text-foreground">Value</th>
                    <th className="text-left p-4 font-semibold text-foreground">Status</th>
                    <th className="text-left p-4 font-semibold text-foreground">Created</th>
                    <th className="text-left p-4 font-semibold text-foreground">Redeemed By</th>
                    <th className="text-left p-4 font-semibold text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {codes.map((code) => (
                    <tr key={code._id} className="hover:bg-primary/5 transition-colors">
                      <td className="p-4">
                        <span className="font-mono text-sm bg-background/50 px-2 py-1 rounded">
                          {code.code}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="font-semibold text-primary">{code.value} credits</span>
                      </td>
                      <td className="p-4">
                        {getStatusBadge(code)}
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {formatDate(code.createdAt)}
                      </td>
                      <td className="p-4 text-sm">
                        {code.redeemedBy ? (
                          <div>
                            <div className="font-medium text-foreground">{code.redeemedBy.name}</div>
                            <div className="text-muted-foreground">@{code.redeemedBy.username}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => copyToClipboard(code.code)}
                          className="p-2 hover:bg-primary/10 rounded-lg transition-colors"
                          title="Copy code"
                        >
                          {copiedCode === code.code ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-border/50 flex items-center justify-between">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-background/50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/10 transition-colors"
                >
                  Previous
                </button>
                
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-background/50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/10 transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Generate Codes Modal */}
        {showGenerateModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="relative bg-card/95 backdrop-blur-sm rounded-2xl p-6 w-full max-w-md border border-primary/20">
              <h2 className="text-2xl font-bold text-foreground mb-6">Generate Payment Codes</h2>
              
              <form onSubmit={handleGenerateCodes} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Credit Amount
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    value={generateForm.amount}
                    onChange={(e) => setGenerateForm(prev => ({ ...prev, amount: parseInt(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 bg-background/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">Amount per code (1-10,000 credits)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={generateForm.quantity}
                    onChange={(e) => setGenerateForm(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 bg-background/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">Number of codes to generate (1-100)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Description (Optional)
                  </label>
                  <input
                    type="text"
                    maxLength="200"
                    value={generateForm.description}
                    onChange={(e) => setGenerateForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-3 bg-background/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="e.g., Holiday promotion codes"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowGenerateModal(false)}
                    className="flex-1 px-4 py-3 bg-background/50 text-foreground rounded-lg hover:bg-background/70 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={generating}
                    className="flex-1 cosmic-button py-3 font-semibold disabled:opacity-50"
                  >
                    {generating ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader className="w-5 h-5 animate-spin" />
                        Generating...
                      </div>
                    ) : (
                      'Generate'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentCodeManager;

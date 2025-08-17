import React, { useState, useEffect } from 'react';
import { 
  X, 
  History, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  Gift,
  ChevronLeft,
  ChevronRight,
  Filter
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import paymentService from '../../services/paymentService';

const TransactionHistory = ({ onClose }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchTransactions();
  }, [currentPage, filter]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10
      };
      
      if (filter !== 'all') {
        params.type = filter;
      }

      const response = await paymentService.getTransactions(params);
      setTransactions(response.data.transactions);
      setPagination(response.data.pagination);
    } catch (error) {
      toast.error(error.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'credit':
        return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'debit':
        return <TrendingDown className="w-5 h-5 text-red-500" />;
      case 'refund':
        return <RefreshCw className="w-5 h-5 text-blue-500" />;
      case 'bonus':
        return <Gift className="w-5 h-5 text-purple-500" />;
      default:
        return <History className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case 'credit':
        return 'text-green-500';
      case 'debit':
        return 'text-red-500';
      case 'refund':
        return 'text-blue-500';
      case 'bonus':
        return 'text-purple-500';
      default:
        return 'text-muted-foreground';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="relative bg-card/95 backdrop-blur-sm rounded-2xl w-full max-w-2xl max-h-[80vh] border border-primary/20 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <History className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">Transaction History</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-primary/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-background/50 border border-border rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="all">All Transactions</option>
              <option value="credit">Credits</option>
              <option value="debit">Debits</option>
              <option value="refund">Refunds</option>
              <option value="bonus">Bonuses</option>
            </select>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-center gap-4 p-4 bg-background/30 rounded-lg">
                  <div className="w-10 h-10 bg-primary/20 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-primary/20 rounded w-3/4"></div>
                    <div className="h-3 bg-primary/10 rounded w-1/2"></div>
                  </div>
                  <div className="h-6 bg-primary/20 rounded w-16"></div>
                </div>
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <History className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Transactions</h3>
              <p className="text-muted-foreground">
                {filter === 'all' 
                  ? "You haven't made any transactions yet."
                  : `No ${filter} transactions found.`
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div
                  key={transaction._id}
                  className="flex items-center gap-4 p-4 bg-background/30 rounded-lg hover:bg-background/50 transition-colors"
                >
                  <div className="flex-shrink-0">
                    {getTransactionIcon(transaction.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground truncate">
                      {transaction.description}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{formatDate(transaction.createdAt)}</span>
                      {transaction.reference && (
                        <span className="font-mono text-xs bg-primary/10 px-2 py-1 rounded">
                          {transaction.reference}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`font-bold ${getTransactionColor(transaction.type)}`}>
                      {transaction.type === 'debit' ? '-' : '+'}
                      {transaction.amount} credits
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Balance: {transaction.balanceAfter}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="p-4 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Page {pagination.currentPage} of {pagination.totalPages}
                {pagination.totalTransactions > 0 && (
                  <span> • {pagination.totalTransactions} total</span>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={!pagination.hasPrevPage}
                  className="p-2 hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                <span className="px-3 py-1 bg-primary/10 rounded-lg text-sm font-medium">
                  {pagination.currentPage}
                </span>
                
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={!pagination.hasNextPage}
                  className="p-2 hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionHistory;

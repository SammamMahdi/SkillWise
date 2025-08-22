import React, { useState, useEffect } from 'react'

const Poll = ({ post, onVote }) => {
  const [voting, setVoting] = useState(false)
  const options = post.poll?.options || []
  
  // Calculate total votes and percentages
  const totalVotes = options.reduce((sum, opt) => sum + (opt.votes?.length || 0), 0)
  
  const getVotePercentage = (votes) => {
    if (totalVotes === 0) return 0
    return Math.round((votes / totalVotes) * 100)
  }
  
  // Check if current user has already voted
  const [currentUserId, setCurrentUserId] = useState(null)
  
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        setCurrentUserId(payload.userId)
      } catch (e) {
        console.error('Failed to parse token:', e)
      }
    }
  }, [])
  
  const hasUserVoted = options.some(opt => 
    opt.votes?.some(vote => vote.toString() === currentUserId?.toString())
  )
  
  const getUserVotedOption = () => {
    return options.find(opt => 
      opt.votes?.some(vote => vote.toString() === currentUserId?.toString())
    )
  }
  
  const handleVote = async (optionId) => {
    setVoting(true)
    try {
      await onVote(post._id, optionId)
    } finally {
      setVoting(false)
    }
  }
  
  return (
    <div className="space-y-3">
      <div className="font-medium text-lg">{post.poll?.question}</div>
      <div className="space-y-2">
        {options.map(opt => {
          const voteCount = opt.votes?.length || 0
          const percentage = getVotePercentage(voteCount)
          const isVoted = opt.votes?.some(vote => vote.toString() === currentUserId?.toString())
          
          return (
            <div key={opt.optionId} className="relative">
              <button
                disabled={voting}
                onClick={() => handleVote(opt.optionId)}
                className={`w-full px-3 py-2 rounded-lg border text-left flex items-center justify-between transition-all ${
                  isVoted 
                    ? 'border-blue-400 bg-blue-400/20 hover:bg-blue-400/30 cursor-pointer' 
                    : hasUserVoted 
                      ? 'border-white/20 bg-white/5 hover:bg-white/10 cursor-pointer'
                      : 'border-white/10 hover:bg-white/10 cursor-pointer'
                }`}
                title={isVoted ? 'Click to remove your vote' : hasUserVoted ? 'Click to change your vote' : 'Click to vote'}
              >
                <span className="flex-1">{opt.text}</span>
                <div className="flex items-center gap-2">
                  <span className="text-white/60 text-sm">{voteCount} votes</span>
                  <span className="text-white/80 text-sm font-medium">{percentage}%</span>
                  {isVoted && (
                    <span className="text-blue-400 text-xs">✓ Your vote</span>
                  )}
                </div>
              </button>
              
              {/* Progress bar */}
              <div className="absolute bottom-0 left-0 h-1 bg-white/10 rounded-b-lg overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${
                    isVoted ? 'bg-blue-400' : 'bg-blue-400/60'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              
              {/* Show usernames who voted for this option */}
              {opt.votes && opt.votes.length > 0 && (
                <div className="mt-1 ml-2 text-xs text-white/60">
                  Voted by: {opt.votes.map((vote, idx) => (
                    <span key={idx}>
                      {vote.name || 'User'}{idx < opt.votes.length - 1 ? ', ' : ''}
                    </span>
                  )).slice(0, 3)}
                  {opt.votes.length > 3 && ` and ${opt.votes.length - 3} more`}
                </div>
              )}
            </div>
          )
        })}
      </div>
      
      {hasUserVoted && (
        <div className="text-sm text-blue-400">
          You voted for: "{getUserVotedOption()?.text}"
          <span className="text-xs text-blue-300 ml-2">(Click on any option to change or remove your vote)</span>
        </div>
      )}
      
      {!hasUserVoted && totalVotes > 0 && (
        <div className="text-sm text-white/60">
          Total votes: {totalVotes}
        </div>
      )}
    </div>
  )
}

export default Poll

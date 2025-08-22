import React, { useEffect, useRef } from 'react'

const PostHighlighter = ({ postId, post, children }) => {
  const postRef = useRef(null)

  useEffect(() => {
    if (postId && post._id === postId) {
      const timer = setTimeout(() => {
        if (postRef.current) {
          postRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
          // Add a highlight effect
          postRef.current.style.transition = 'box-shadow 0.5s ease-in-out'
          postRef.current.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.5)'
          
          // Remove the highlight after some time
          setTimeout(() => {
            if (postRef.current) {
              postRef.current.style.boxShadow = 'none'
            }
          }, 3000)
        }
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [postId, post._id])

  return (
    <div 
      id={`post-${post._id}`} 
      ref={postRef}
      className="post-container"
    >
      {children}
    </div>
  )
}

export default PostHighlighter

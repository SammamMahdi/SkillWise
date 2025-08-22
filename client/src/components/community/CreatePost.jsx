import React, { useEffect, useMemo, useState } from 'react'
import { communityService } from '../../services/communityService'

const PRIVACY = [
  { value: 'public', label: 'Public' },
  { value: 'friends', label: 'Friends' },
  { value: 'only_me', label: 'Only Me' },
]

const TYPE_TABS = [
  { value: 'blog', label: 'Blog' },
  { value: 'image', label: 'Images' },
  { value: 'poll', label: 'Poll' },
  { value: 'debate', label: 'Debate' },
  { value: 'share_course', label: 'Share Course' },
]

const CreatePost = ({ onCreated }) => {
  const [type, setType] = useState('blog')
  const [privacy, setPrivacy] = useState('public')
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [images, setImages] = useState([])
  const [uploading, setUploading] = useState(false)
  const [pollQuestion, setPollQuestion] = useState('')
  const [pollOptions, setPollOptions] = useState([{ optionId: 'a', text: '' }, { optionId: 'b', text: '' }])
  const [debateTopic, setDebateTopic] = useState('')
  const [enrollments, setEnrollments] = useState([])
  const [selectedCourseId, setSelectedCourseId] = useState('')

  useEffect(() => {
    if (type === 'share_course') {
      communityService.getShareableEnrollments().then(res => {
        if (res.success) setEnrollments(res.data)
      })
    }
  }, [type])

  const onImageFiles = async (files) => {
    setUploading(true)
    try {
      const arr = Array.from(files)
      const res = await communityService.uploadImages(arr)
      if (res.success) setImages(prev => [...prev, ...res.data])
    } finally {
      setUploading(false)
    }
  }

  const canSubmit = useMemo(() => {
    if (type === 'blog') return title.trim() || text.trim()
    if (type === 'image') return images.length > 0
    if (type === 'poll') return pollQuestion.trim() && pollOptions.every(o => o.text.trim())
    if (type === 'debate') return debateTopic.trim()
    if (type === 'share_course') return !!selectedCourseId
    return false
  }, [type, title, text, images, pollQuestion, pollOptions, debateTopic, selectedCourseId])

  const submit = async () => {
    const payload = { type, privacy }
    if (type === 'blog') Object.assign(payload, { title, text })
    if (type === 'image') Object.assign(payload, { images, text })
    if (type === 'poll') Object.assign(payload, { poll: { question: pollQuestion, options: pollOptions } })
    if (type === 'debate') Object.assign(payload, { debateTopic, text })
    if (type === 'share_course') {
      const chosen = enrollments.find(e => (e.course?._id || e.course?.id || e.course) === selectedCourseId)
      if (chosen) Object.assign(payload, { sharedCourse: {
        course: selectedCourseId,
        enrolledAt: chosen.enrolledAt,
        overallProgress: chosen.overallProgress,
        currentLectureIndex: chosen.currentLectureIndex
      }})
    }
    const res = await communityService.createPost(payload)
    if (res.success) {
      onCreated?.(res.data)
      setTitle(''); setText(''); setImages([]); setPollQuestion(''); setPollOptions([{ optionId: 'a', text: '' }, { optionId: 'b', text: '' }]); setDebateTopic(''); setSelectedCourseId(''); setType('blog'); setPrivacy('public')
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {TYPE_TABS.map(tab => (
            <button key={tab.value} onClick={() => setType(tab.value)} className={`px-3 py-1.5 rounded-lg text-sm border ${type === tab.value ? 'bg-primary/20 border-primary/40 text-primary' : 'bg-white/5 border-white/10 text-white/80'}`}>
              {tab.label}
            </button>
          ))}
        </div>
        <select value={privacy} onChange={e => setPrivacy(e.target.value)} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm">
          {PRIVACY.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
      </div>

      {/* Privacy information */}
      <div className="text-xs text-white/60 bg-white/5 p-2 rounded-lg border border-white/10">
        {privacy === 'public' ? (
          <span className="text-green-400">🌍 Public posts can be viewed and shared by everyone</span>
        ) : privacy === 'friends' ? (
          <span className="text-blue-400">👥 Friends-only posts can only be viewed by your friends</span>
        ) : (
          <span className="text-gray-400">🔒 Private posts are only visible to you</span>
        )}
        {privacy !== 'public' && (
          <span className="block mt-1 text-white/50">Note: Only public posts can be shared by other users</span>
        )}
      </div>

      {type === 'blog' && (
        <div className="space-y-2">
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10" />
          <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Write your blog..." className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 min-h-28" />
        </div>
      )}

      {type === 'image' && (
        <div className="space-y-2">
          <input type="file" accept="image/*" multiple onChange={e => onImageFiles(e.target.files)} />
          {uploading && <div className="text-xs text-white/60">Uploading...</div>}
          <div className="grid grid-cols-3 gap-2">
            {images.map((img, idx) => (
              <img key={idx} src={img.webp || img.original} alt="preview" className="w-full h-24 object-cover rounded-lg" />
            ))}
          </div>
          <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Say something about these images..." className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 min-h-20" />
        </div>
      )}

      {type === 'poll' && (
        <div className="space-y-2">
          <input value={pollQuestion} onChange={e => setPollQuestion(e.target.value)} placeholder="Poll question" className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10" />
          <div className="space-y-2">
            {pollOptions.map((opt, idx) => (
              <input key={opt.optionId} value={opt.text} onChange={e => setPollOptions(prev => prev.map((o, i) => i === idx ? { ...o, text: e.target.value } : o))} placeholder={`Option ${idx + 1}`} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10" />
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setPollOptions(prev => [...prev, { optionId: Math.random().toString(36).slice(2, 7), text: '' }])} className="px-3 py-1.5 rounded-lg bg-white/10">Add option</button>
            {pollOptions.length > 2 && (
              <button onClick={() => setPollOptions(prev => prev.slice(0, -1))} className="px-3 py-1.5 rounded-lg bg-white/10">Remove last</button>
            )}
          </div>
        </div>
      )}

      {type === 'debate' && (
        <div className="space-y-2">
          <input value={debateTopic} onChange={e => setDebateTopic(e.target.value)} placeholder="Debate topic" className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10" />
          <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Opening statement (optional)" className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 min-h-20" />
        </div>
      )}

      {type === 'share_course' && (
        <div className="space-y-2">
          <select value={selectedCourseId} onChange={e => setSelectedCourseId(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10">
            <option value="">Select one of your enrolled courses</option>
            {enrollments.map(en => (
              <option key={en.course?._id || en.course?.id || en.course} value={en.course?._id || en.course?.id || en.course}>
                {en.course?.title}
              </option>
            ))}
          </select>
          <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Share your journey..." className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 min-h-20" />
        </div>
      )}

      <div className="flex justify-end">
        <button disabled={!canSubmit} onClick={submit} className="px-4 py-2 rounded-lg bg-primary/30 border border-primary/40 disabled:opacity-50">Post</button>
      </div>
    </div>
  )
}

export default CreatePost





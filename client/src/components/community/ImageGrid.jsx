import React from 'react'

const ImageGrid = ({ images }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
    {(images || []).map((img, idx) => (
      <img key={idx} src={img.webp || img.original} alt="post" className="rounded-lg object-cover w-full h-40" />
    ))}
  </div>
)

export default ImageGrid

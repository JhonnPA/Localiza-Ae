import React from 'react'

export default function Modal({open, onClose, title, children}:{open:boolean; onClose:()=>void; title:string; children:React.ReactNode}){
  if(!open) return null
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
      <div className="card w-full max-w-lg">
        <div className="border-b px-5 py-3 flex items-center justify-between">
          <h3 className="font-semibold">{title}</h3>
          <button onClick={onClose} className="text-gray-500">✕</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

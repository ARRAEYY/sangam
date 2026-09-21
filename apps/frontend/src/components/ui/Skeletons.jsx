import React from 'react'

export function SkeletonProjectCard() {
  return (
    <div className="card min-w-0 flex flex-col gap-3 p-4 sm:p-5 animate-pulse h-[180px]">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="h-5 w-3/4 bg-slate-200 rounded-md"></div>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-4 w-16 bg-slate-200 rounded-full"></div>
            <div className="h-4 w-10 bg-slate-200 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2 mt-2">
        <div className="h-3 w-full bg-slate-100 rounded-md"></div>
        <div className="h-3 w-5/6 bg-slate-100 rounded-md"></div>
      </div>

      {/* Skill pills */}
      <div className="flex flex-wrap gap-1.5 mt-2">
        <div className="h-5 w-12 bg-slate-100 rounded-full"></div>
        <div className="h-5 w-16 bg-slate-100 rounded-full"></div>
        <div className="h-5 w-10 bg-slate-100 rounded-full"></div>
      </div>

      {/* Footer */}
      <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-slate-100 pt-2.5">
        <div className="flex items-center gap-1.5">
          <div className="h-4 w-4 bg-slate-200 rounded-full"></div>
          <div className="h-3 w-20 bg-slate-200 rounded-md"></div>
        </div>
        <div className="h-3 w-16 bg-slate-200 rounded-md"></div>
      </div>
    </div>
  )
}

export function SkeletonTalentCard() {
  return (
    <div className="card min-w-0 flex flex-col p-5 animate-pulse h-[220px]">
      <div className="flex min-w-0 items-center gap-3">
        <div className="h-10 w-10 shrink-0 rounded-full bg-slate-200"></div>
        <div className="min-w-0 flex-1">
          <div className="h-4 w-1/2 bg-slate-200 rounded-md mb-1.5"></div>
          <div className="h-3 w-3/4 bg-slate-100 rounded-md"></div>
        </div>
      </div>
      
      <div className="space-y-2 mt-4">
        <div className="h-3 w-full bg-slate-100 rounded-md"></div>
        <div className="h-3 w-4/5 bg-slate-100 rounded-md"></div>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        <div className="h-5 w-12 bg-slate-100 rounded-full"></div>
        <div className="h-5 w-16 bg-slate-100 rounded-full"></div>
        <div className="h-5 w-14 bg-slate-100 rounded-full"></div>
      </div>

      <div className="mt-auto pt-3">
        <div className="flex gap-3 border-t border-slate-100 pt-3">
          <div className="h-3 w-3 bg-slate-200 rounded-sm"></div>
          <div className="h-3 w-3 bg-slate-200 rounded-sm"></div>
          <div className="h-3 w-3 bg-slate-200 rounded-sm"></div>
        </div>
      </div>
    </div>
  )
}

export function SkeletonNotification() {
  return (
    <div className="group flex items-start gap-4 border-b border-slate-100 px-5 py-4 last:border-0 bg-white animate-pulse">
      <div className="mt-1 shrink-0 rounded-full bg-slate-200 h-8 w-8"></div>
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-4 w-3/4 bg-slate-200 rounded-md"></div>
        <div className="h-3 w-1/2 bg-slate-100 rounded-md"></div>
      </div>
    </div>
  )
}

export function SkeletonProfileHeader() {
  return (
    <div className="card overflow-hidden animate-pulse mb-6">
      <div className="h-24 sm:h-32 bg-slate-200"></div>
      <div className="relative px-5 pb-5 sm:px-6 sm:pb-6">
        <div className="absolute -top-10 sm:-top-12">
          <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full border-4 border-white bg-slate-300"></div>
        </div>
        <div className="flex justify-end pt-3 sm:pt-4">
          <div className="h-9 w-24 bg-slate-200 rounded-full"></div>
        </div>
        <div className="mt-6 sm:mt-2 space-y-2">
          <div className="h-6 w-48 bg-slate-200 rounded-md"></div>
          <div className="h-4 w-64 bg-slate-100 rounded-md"></div>
        </div>
        <div className="mt-4 flex gap-4">
          <div className="h-4 w-20 bg-slate-100 rounded-md"></div>
          <div className="h-4 w-24 bg-slate-100 rounded-md"></div>
        </div>
      </div>
    </div>
  )
}

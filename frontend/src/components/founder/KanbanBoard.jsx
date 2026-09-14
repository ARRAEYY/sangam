import React from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { GripVertical, Clock, CheckCircle2, AlertCircle, PlayCircle } from 'lucide-react'

const COLUMNS = [
  { id: 'Todo', icon: <Clock size={16} />, color: 'bg-slate-100 text-slate-600' },
  { id: 'In Progress', icon: <PlayCircle size={16} />, color: 'bg-blue-100 text-blue-600' },
  { id: 'Ready for Review', icon: <AlertCircle size={16} />, color: 'bg-amber-100 text-amber-600' },
  { id: 'Completed', icon: <CheckCircle2 size={16} />, color: 'bg-green-100 text-green-600' },
]

export default function KanbanBoard({ tasks, onTaskMove, isLoading, error }) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="font-medium">Loading board...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="inline-flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-lg border border-red-100">
          <AlertCircle size={20} />
          <p className="font-medium">{error}</p>
        </div>
      </div>
    )
  }

  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result
    if (!destination) return
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return
    }

    onTaskMove(draggableId, source.droppableId, destination.droppableId)
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full h-full">
        {COLUMNS.map((col) => (
          <div key={col.id} className="flex flex-col h-full min-w-[300px]">
            <div className="flex items-center justify-between mb-4 px-2">
              <div className="flex items-center gap-2">
                <span className={`p-1 rounded-md ${col.color}`}>{col.icon}</span>
                <h3 className="text-lg font-bold text-indigo-900">{col.id}</h3>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded-full">
                {tasks.filter(t => t.status === col.id).length}
              </span>
            </div>

            <Droppable droppableId={col.id}>
              {(provided, snapshot) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className={`flex-1 p-3 rounded-2xl border-2 transition-colors duration-200 ${
                    snapshot.isDraggingOver ? 'bg-indigo-100 border-indigo-300' : 'bg-indigo-50 border-transparent'
                  }`}
                >
                  <div className="flex flex-col gap-3">
                    {tasks
                      .filter((t) => t.status === col.id)
                      .map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`group p-4 bg-white rounded-xl border-l-4 shadow-sm transition-all duration-200 ${
                                snapshot.isDragging
                                  ? 'shadow-xl ring-2 ring-indigo-400 border-indigo-600 scale-105'
                                  : 'border-transparent hover:border-yellow-400 hover:shadow-md'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                  <h4 className="text-sm font-bold text-indigo-900 mb-1 group-hover:text-indigo-800 transition-colors">
                                    {task.title}
                                  </h4>
                                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                                    {task.description}
                                  </p>
                                </div>
                                <GripVertical size={16} className="text-slate-300 group-hover:text-slate-400 transition-colors shrink-0" />
                              </div>

                              {task.priority && (
                                <div className="mt-3 flex items-center gap-2">
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                    task.priority === 'high' ? 'bg-red-100 text-red-600' :
                                    task.priority === 'medium' ? 'bg-amber-100 text-amber-600' :
                                    'bg-blue-100 text-blue-600'
                                  }`}>
                                    {task.priority}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                  </div>
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  )
}

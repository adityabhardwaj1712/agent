'use client';

import React, { useState } from 'react';

interface DraggableWidgetProps {
  id: string;
  children: React.ReactNode;
  onReorder: (draggedId: string, targetId: string) => void;
}

const DraggableWidget: React.FC<DraggableWidgetProps> = ({ id, children, onReorder }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    if (e.dataTransfer) {
      e.dataTransfer.setData('widgetId', id);
    }
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer) {
      const draggedId = e.dataTransfer.getData('widgetId');
      if (draggedId && draggedId !== id) {
        onReorder(draggedId, id);
      }
    }
    setIsDragging(false);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`transition-all duration-300 cursor-grab active:cursor-grabbing ${
        isDragging 
        ? 'opacity-40 scale-95 grayscale blur-[1px] rotate-1' 
        : 'opacity-100 scale-100'
      }`}
    >
      {children}
    </div>
  );
};

export default DraggableWidget;

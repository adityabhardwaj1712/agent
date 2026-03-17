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
      style={{
        cursor: 'grab',
        opacity: isDragging ? 0.5 : 1,
        transition: 'all 0.2s ease',
        transform: isDragging ? 'scale(0.98)' : 'scale(1)',
      }}
    >
      {children}
    </div>
  );
};

export default DraggableWidget;

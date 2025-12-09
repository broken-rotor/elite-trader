import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import '../Tooltip.css';

function Tooltip({ children, content, disabled }) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (visible && wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      setPosition({
        top: rect.top + window.scrollY,
        left: rect.left + rect.width / 2 + window.scrollX
      });
    }
  }, [visible]);

  if (!disabled) {
    return children;
  }

  return (
    <>
      <div
        ref={wrapperRef}
        className="tooltip-wrapper"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
      >
        {children}
      </div>
      {visible && createPortal(
        <div
          className="custom-tooltip"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`
          }}
        >
          {content}
        </div>,
        document.body
      )}
    </>
  );
}

export default Tooltip;

import type { FunctionComponent } from 'react';
import react from 'react';
import './QuickLook.css';

const QuickLook: FunctionComponent = ({ children }) => {
  return (
    <div className="parent">
      { children }
    </div>
  )
};

export default QuickLook;